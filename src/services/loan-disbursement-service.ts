import { createHash, randomUUID } from "node:crypto";
import type { Knex } from "knex";
import { withTenantTransaction } from "../database/client.js";
import type { LendingApprovalGateway } from "./approval-gateway.js";
import { DomainError } from "./domain-error.js";
export interface DisbursementLedgerGateway {
  post(input: {
    tenantId: string;
    idempotencyKey: string;
    reference: string;
    currency: string;
    debitAccountId: string;
    creditAccountId: string;
    amountMinor: string;
  }): Promise<{ transactionId: string; replayed: boolean }>;
  reverse(input: {
    tenantId: string;
    transactionId: string;
    idempotencyKey: string;
    reason: string;
    automatedRuleId: string;
  }): Promise<{ transactionId: string; replayed: boolean }>;
}
export interface DisbursementPaymentGateway {
  submit(input: {
    tenantId: string;
    sourceResourceId: string;
    customerId: string;
    ledgerTransactionId: string;
    destinationReference: string;
    amountMinor: string;
    currency: "NGN";
    idempotencyKey: string;
    correlationId: string;
  }): Promise<{
    paymentId: string;
    status: "PENDING" | "SUCCEEDED" | "FAILED";
    replayed: boolean;
  }>;
}
export class LoanDisbursementService {
  constructor(
    private readonly db: Knex,
    private readonly approvals: LendingApprovalGateway,
    private readonly ledger: DisbursementLedgerGateway,
    private readonly payment: DisbursementPaymentGateway,
  ) {}
  async start(input: {
    tenantId: string;
    loanId: string;
    destinationReference: string;
    receivableLedgerAccountId: string;
    fundingLedgerAccountId: string;
    approvalId: string;
    executorId: string;
    idempotencyKey: string;
    correlationId: string;
  }) {
    let row = await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loan_disbursements")
        .where({
          tenant_id: input.tenantId,
          idempotency_key: input.idempotencyKey,
        })
        .first<DisbursementRow>(),
    );
    if (row) {
      if (
        row.loan_id !== input.loanId ||
        row.request_hash !==
          payloadHashOf(input.loanId, input.destinationReference, row.amount)
      )
        throw new DomainError(
          "Idempotency key reused with a different disbursement",
        );
    } else {
      const source = await withTenantTransaction(
        this.db,
        input.tenantId,
        (tx) =>
          tx("loans as l")
            .join("loan_offers as o", function () {
              this.on("o.id", "=", "l.accepted_offer_id").andOn(
                "o.tenant_id",
                "=",
                "l.tenant_id",
              );
            })
            .where({
              "l.tenant_id": input.tenantId,
              "l.id": input.loanId,
              "l.status": "APPROVED",
            })
            .first<{ amount: string }>({ amount: "o.net_disbursement_amount" }),
      );
      if (!source) throw new DomainError("Approved contracted loan not found");
      // Persist first so the approval binds to a stable resource; the
      // in-flight unique index rejects a concurrent disbursement for the loan.
      const id = randomUUID();
      const payloadHash = payloadHashOf(
        input.loanId,
        input.destinationReference,
        source.amount,
      );
      row = {
        id,
        loan_id: input.loanId,
        status: "APPROVAL_PENDING",
        amount: String(source.amount),
        request_hash: payloadHash,
        ledger_transaction_id: null,
      };
      await withTenantTransaction(this.db, input.tenantId, (tx) =>
        tx("loan_disbursements").insert({
          id,
          tenant_id: input.tenantId,
          loan_id: input.loanId,
          disbursement_reference: `DISB-${id}`,
          destination_reference: input.destinationReference,
          amount: source.amount,
          currency: "NGN",
          status: "APPROVAL_PENDING",
          idempotency_key: input.idempotencyKey,
          request_hash: payloadHash,
          correlation_id: input.correlationId,
          active_step: "APPROVAL",
        }),
      );
    }
    const id = row.id;
    const amount = String(row.amount);
    if (row.status === "APPROVAL_PENDING") {
      const approval = await this.approvals.consume({
        tenantId: input.tenantId,
        approvalId: input.approvalId,
        action: "LOAN_DISBURSEMENT",
        resourceType: "loan_disbursement",
        resourceId: id,
        payloadHash: row.request_hash,
        idempotencyKey: `${input.idempotencyKey}:approval`,
        correlationId: input.correlationId,
      });
      if (
        !approval.makerId ||
        !approval.checkerIds?.length ||
        !approval.consumedAt
      )
        throw new DomainError("Approval evidence incomplete");
      await withTenantTransaction(this.db, input.tenantId, (tx) =>
        tx("loan_disbursements")
          .where({ id, tenant_id: input.tenantId, status: "APPROVAL_PENDING" })
          .update({
            status: "LEDGER_POSTING",
            approval_id: approval.approvalId,
            approval_payload_hash: row.request_hash,
            approval_consumed_at: approval.consumedAt,
            approval_maker_id: approval.makerId,
            approval_checker_ids: JSON.stringify(approval.checkerIds),
            active_step: "LEDGER_POST",
          }),
      );
      row = { ...row, status: "LEDGER_POSTING" };
    }
    if (row.status !== "LEDGER_POSTING" && row.status !== "PAYMENT_SUBMITTING")
      return { id, status: row.status };
    let ledgerTransactionId = row.ledger_transaction_id;
    if (row.status === "LEDGER_POSTING" || !ledgerTransactionId) {
      const posting = await this.ledger.post({
        tenantId: input.tenantId,
        idempotencyKey: `disbursement:${id}:ledger`,
        reference: `DISB-${id}`,
        currency: "NGN",
        debitAccountId: input.receivableLedgerAccountId,
        creditAccountId: input.fundingLedgerAccountId,
        amountMinor: amount,
      });
      ledgerTransactionId = posting.transactionId;
      await withTenantTransaction(this.db, input.tenantId, (tx) =>
        tx("loan_disbursements")
          .where({ id, tenant_id: input.tenantId })
          .update({
            ledger_transaction_id: ledgerTransactionId,
            status: "PAYMENT_SUBMITTING",
            active_step: "PAYMENT_SUBMIT",
          }),
      );
    }
    const loan = await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loans")
        .where({ tenant_id: input.tenantId, id: input.loanId })
        .first<{ customer_id: string }>("customer_id"),
    );
    if (!loan) throw new DomainError("Disbursement loan not found");
    const payout = await this.payment.submit({
      tenantId: input.tenantId,
      sourceResourceId: id,
      customerId: loan.customer_id,
      ledgerTransactionId,
      destinationReference: input.destinationReference,
      amountMinor: amount,
      currency: "NGN",
      idempotencyKey: `disbursement:${id}:payment`,
      correlationId: input.correlationId,
    });
    if (payout.status === "FAILED") {
      const reversal = await this.ledger.reverse({
        tenantId: input.tenantId,
        transactionId: ledgerTransactionId,
        idempotencyKey: `disbursement:${id}:reversal`,
        reason: "Final payment payout failure",
        automatedRuleId: "PRE_APPROVED_DISBURSEMENT_COMPENSATION",
      });
      await withTenantTransaction(this.db, input.tenantId, (tx) =>
        tx("loan_disbursements").where({ id }).update({
          status: "COMPENSATED",
          payment_transaction_id: payout.paymentId,
          ledger_reversal_transaction_id: reversal.transactionId,
          processed_at: tx.fn.now(),
        }),
      );
      return { id, status: "COMPENSATED" as const };
    }
    await withTenantTransaction(this.db, input.tenantId, async (tx) => {
      await tx("loan_disbursements")
        .where({ id })
        .update({
          status: payout.status,
          payment_transaction_id: payout.paymentId,
          next_inquiry_at:
            payout.status === "PENDING" ? new Date(Date.now() + 30_000) : null,
          processed_at: payout.status === "SUCCEEDED" ? tx.fn.now() : null,
        });
      if (payout.status === "SUCCEEDED") {
        await tx("loans")
          .where({ id: input.loanId, tenant_id: input.tenantId })
          .update({
            status: "DISBURSED",
            disbursed_amount: amount,
            disbursement_date: tx.fn.now(),
          });
        await tx("loan_outbox_events").insert({
          tenant_id: input.tenantId,
          aggregate_type: "loan",
          aggregate_id: input.loanId,
          event_type: "loan.disbursed.v1",
          event_version: 1,
          idempotency_key: `loan:${input.loanId}:disbursed`,
          correlation_id: input.correlationId,
          payload: {
            loan_id: input.loanId,
            disbursement_id: id,
            payment_id: payout.paymentId,
            ledger_transaction_id: ledgerTransactionId,
            amount_minor: amount,
            currency: "NGN",
          },
        });
      }
    });
    return { id, status: payout.status };
  }
}
interface DisbursementRow {
  id: string;
  loan_id: string;
  status: string;
  amount: string;
  request_hash: string;
  ledger_transaction_id: string | null;
}
function payloadHashOf(
  loanId: string,
  destinationReference: string,
  amount: string | number,
) {
  return hash({
    loanId,
    destinationReference,
    amountMinor: String(amount),
    currency: "NGN",
  });
}
function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

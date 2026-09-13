import { createHash, randomUUID } from "node:crypto";
import type { Knex } from "knex";
import { withTenantTransaction } from "../database/client.js";
import type { LendingApprovalGateway } from "./approval-gateway.js";
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
    const source = await withTenantTransaction(this.db, input.tenantId, (tx) =>
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
        .first<{ customer_id: string; amount: string }>({
          customer_id: "l.customer_id",
          amount: "o.net_disbursement_amount",
        }),
    );
    if (!source) throw new Error("Approved contracted loan not found");
    const id = randomUUID();
    const payloadHash = hash({
      loanId: input.loanId,
      destinationReference: input.destinationReference,
      amountMinor: source.amount,
      currency: "NGN",
    });
    const approval = await this.approvals.consume({
      tenantId: input.tenantId,
      approvalId: input.approvalId,
      action: "LOAN_DISBURSEMENT",
      resourceType: "loan_disbursement",
      resourceId: id,
      payloadHash,
      idempotencyKey: `${input.idempotencyKey}:approval`,
      correlationId: input.correlationId,
    });
    if (
      !approval.makerId ||
      !approval.checkerIds?.length ||
      !approval.consumedAt
    )
      throw new Error("Approval evidence incomplete");
    await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loan_disbursements").insert({
        id,
        tenant_id: input.tenantId,
        loan_id: input.loanId,
        disbursement_reference: `DISB-${id}`,
        destination_reference: input.destinationReference,
        amount: source.amount,
        currency: "NGN",
        status: "LEDGER_POSTING",
        approval_id: approval.approvalId,
        approval_payload_hash: payloadHash,
        approval_consumed_at: approval.consumedAt,
        approval_maker_id: approval.makerId,
        approval_checker_ids: JSON.stringify(approval.checkerIds),
        idempotency_key: input.idempotencyKey,
        request_hash: payloadHash,
        correlation_id: input.correlationId,
        active_step: "LEDGER_POST",
      }),
    );
    const posting = await this.ledger.post({
      tenantId: input.tenantId,
      idempotencyKey: `disbursement:${id}:ledger`,
      reference: `DISB-${id}`,
      currency: "NGN",
      debitAccountId: input.receivableLedgerAccountId,
      creditAccountId: input.fundingLedgerAccountId,
      amountMinor: source.amount,
    });
    await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loan_disbursements").where({ id, tenant_id: input.tenantId }).update({
        ledger_transaction_id: posting.transactionId,
        status: "PAYMENT_SUBMITTING",
        active_step: "PAYMENT_SUBMIT",
      }),
    );
    const payout = await this.payment.submit({
      tenantId: input.tenantId,
      sourceResourceId: id,
      customerId: source.customer_id,
      ledgerTransactionId: posting.transactionId,
      destinationReference: input.destinationReference,
      amountMinor: source.amount,
      currency: "NGN",
      idempotencyKey: `disbursement:${id}:payment`,
      correlationId: input.correlationId,
    });
    if (payout.status === "FAILED") {
      const reversal = await this.ledger.reverse({
        tenantId: input.tenantId,
        transactionId: posting.transactionId,
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
            disbursed_amount: source.amount,
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
            ledger_transaction_id: posting.transactionId,
            amount_minor: source.amount,
            currency: "NGN",
          },
        });
      }
    });
    return { id, status: payout.status };
  }
}
function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

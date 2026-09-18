import { createHash, randomUUID } from "node:crypto";
import type { Knex } from "knex";
import { withTenantTransaction } from "../database/client.js";

export type RepaymentComponent = "PENALTY" | "FEES" | "INTEREST" | "PRINCIPAL";
export interface DueInstallment {
  id: string;
  installmentNumber: number;
  penaltyDue: bigint;
  penaltyPaid: bigint;
  feesDue: bigint;
  feesPaid: bigint;
  interestDue: bigint;
  interestPaid: bigint;
  principalDue: bigint;
  principalPaid: bigint;
}
export interface AllocationLine {
  installmentId: string;
  installmentNumber: number;
  component: RepaymentComponent;
  amount: bigint;
}

interface RepaymentRow {
  id: string;
  request_hash: string;
  status: string;
  ledger_idempotency_key: string;
}
interface BatchRow {
  id: string;
  allocated_amount: string;
  unapplied_amount: string;
}
interface PreparedBatch {
  id: string;
  allocated: bigint;
  unapplied: bigint;
}
interface LoanRow {
  customer_id: string;
  product_version_id: string;
  allocation_order: RepaymentComponent[] | string;
}
interface InstallmentRow {
  id: string;
  installment_number: number;
  penalty_due: string;
  penalty_paid: string;
  fees_due: string;
  fees_paid: string;
  interest_due: string;
  interest_paid: string;
  principal_due: string;
  principal_paid: string;
}
interface AllocationLineRow {
  installment_id: string;
  component: RepaymentComponent;
  amount: string;
}
interface PreparedRepayment {
  repayment: RepaymentRow;
  batch: PreparedBatch | undefined;
  replayed: boolean;
}

const fields: Record<
  RepaymentComponent,
  [keyof DueInstallment, keyof DueInstallment]
> = {
  PENALTY: ["penaltyDue", "penaltyPaid"],
  FEES: ["feesDue", "feesPaid"],
  INTEREST: ["interestDue", "interestPaid"],
  PRINCIPAL: ["principalDue", "principalPaid"],
};

/** Pure, deterministic allocation: policy priority first, then oldest installment. */
export function allocateRepayment(
  amount: bigint,
  order: readonly RepaymentComponent[],
  installments: readonly DueInstallment[],
): { lines: AllocationLine[]; allocated: bigint; unapplied: bigint } {
  if (amount <= 0n) throw new Error("Repayment amount must be positive");
  if (
    new Set(order).size !== 4 ||
    Object.keys(fields).some(
      (item) => !order.includes(item as RepaymentComponent),
    )
  )
    throw new Error(
      "Allocation order must contain every component exactly once",
    );
  let remaining = amount;
  const lines: AllocationLine[] = [];
  const sorted = [...installments].sort(
    (a, b) => a.installmentNumber - b.installmentNumber,
  );
  for (const component of order) {
    const [dueField, paidField] = fields[component];
    for (const installment of sorted) {
      const outstanding =
        (installment[dueField] as bigint) - (installment[paidField] as bigint);
      const applied = outstanding > remaining ? remaining : outstanding;
      if (applied > 0n)
        lines.push({
          installmentId: installment.id,
          installmentNumber: installment.installmentNumber,
          component,
          amount: applied,
        });
      remaining -= applied;
      if (remaining === 0n) break;
    }
    if (remaining === 0n) break;
  }
  return { lines, allocated: amount - remaining, unapplied: remaining };
}

export interface RepaymentLedgerGateway {
  post(input: {
    tenantId: string;
    idempotencyKey: string;
    reference: string;
    currency: "NGN";
    debitAccountId: string;
    creditLines: Array<{ accountId: string; amountMinor: string }>;
    amountMinor: string;
  }): Promise<{ transactionId: string; replayed: boolean }>;
  reverse(input: {
    tenantId: string;
    transactionId: string;
    idempotencyKey: string;
    reason: string;
    authorityType: "APPROVAL" | "AUTOMATED_RULE";
    authorityId: string;
  }): Promise<{ transactionId: string; replayed: boolean }>;
}

export class LoanRepaymentService {
  constructor(
    private readonly db: Knex,
    private readonly ledger: RepaymentLedgerGateway,
  ) {}

  async allocateConfirmedPayment(input: {
    tenantId: string;
    loanId: string;
    paymentId: string;
    sourceEventId: string;
    sourceEventType: string;
    sourcePayloadHash: string;
    amountMinor: string;
    currency: "NGN";
    method:
      | "BANK_TRANSFER"
      | "DIRECT_DEBIT"
      | "CARD"
      | "WALLET"
      | "CASH"
      | "PAYMENT_LINK"
      | "INTERNAL_ACCOUNT";
    receivableLedgerAccountId: string;
    cashLedgerAccountId: string;
    unappliedCreditLedgerAccountId: string;
    idempotencyKey: string;
    correlationId: string;
    causationId: string;
  }) {
    const amount = BigInt(input.amountMinor);
    if (amount <= 0n || input.currency !== "NGN")
      throw new Error("Only positive NGN minor-unit repayments are supported");
    const requestHash = hash({
      loanId: input.loanId,
      paymentId: input.paymentId,
      amountMinor: input.amountMinor,
      currency: input.currency,
    });
    const prepared: PreparedRepayment = await withTenantTransaction(
      this.db,
      input.tenantId,
      async (tx) => {
        const replay = (await tx("loan_repayments")
          .where({
            tenant_id: input.tenantId,
            idempotency_key: input.idempotencyKey,
          })
          .first()) as RepaymentRow | undefined;
        if (replay) {
          if (replay.request_hash !== requestHash)
            throw new Error(
              "Idempotency key reused with a different repayment request",
            );
          const batch = (await tx("loan_repayment_allocation_batches")
            .where({ tenant_id: input.tenantId, repayment_id: replay.id })
            .first()) as BatchRow | undefined;
          return {
            repayment: replay,
            batch: batch
              ? {
                  id: batch.id,
                  allocated: BigInt(batch.allocated_amount),
                  unapplied: BigInt(batch.unapplied_amount),
                }
              : undefined,
            lines: [],
            replayed: replay.status === "SUCCESSFUL",
          };
        }
        const loan = (await tx("loans as l")
          .join("loan_product_versions as pv", function () {
            this.on("pv.id", "=", "l.loan_product_version_id").andOn(
              "pv.tenant_id",
              "=",
              "l.tenant_id",
            );
          })
          .where({ "l.tenant_id": input.tenantId, "l.id": input.loanId })
          .whereIn("l.status", ["DISBURSED", "ACTIVE", "OVERDUE"])
          .forUpdate()
          .first({
            customer_id: "l.customer_id",
            product_version_id: "l.loan_product_version_id",
            allocation_order: "pv.repayment_allocation_order",
          })) as unknown as LoanRow | undefined;
        if (!loan) throw new Error("Repayable loan not found");
        const rows = (await tx("loan_installments")
          .where({ tenant_id: input.tenantId, loan_id: input.loanId })
          .orderBy("installment_number")
          .forUpdate()) as InstallmentRow[];
        const installments: DueInstallment[] = rows.map((row) => ({
          id: row.id,
          installmentNumber: row.installment_number,
          penaltyDue: BigInt(row.penalty_due),
          penaltyPaid: BigInt(row.penalty_paid),
          feesDue: BigInt(row.fees_due),
          feesPaid: BigInt(row.fees_paid),
          interestDue: BigInt(row.interest_due),
          interestPaid: BigInt(row.interest_paid),
          principalDue: BigInt(row.principal_due),
          principalPaid: BigInt(row.principal_paid),
        }));
        const order = (
          typeof loan.allocation_order === "string"
            ? JSON.parse(loan.allocation_order)
            : loan.allocation_order
        ) as RepaymentComponent[];
        const allocation = allocateRepayment(amount, order, installments);
        const repaymentId = randomUUID();
        const batchId = randomUUID();
        const policyHash = hash(order);
        const outputHash = hash(
          allocation.lines
            .map((line) => ({ ...line, amount: line.amount.toString() }))
            .concat([
              {
                installmentId: "UNAPPLIED",
                installmentNumber: 0,
                component: "PRINCIPAL",
                amount: allocation.unapplied.toString(),
              },
            ]),
        );
        await tx("loan_repayments").insert({
          id: repaymentId,
          tenant_id: input.tenantId,
          loan_id: input.loanId,
          customer_id: loan.customer_id,
          repayment_reference: `RPY-${repaymentId}`,
          amount: amount.toString(),
          currency: "NGN",
          method: input.method,
          status: "LEDGER_POSTING",
          payment_transaction_id: input.paymentId,
          received_at: tx.fn.now(),
          idempotency_key: input.idempotencyKey,
          request_hash: requestHash,
          correlation_id: input.correlationId,
          causation_id: input.causationId,
          source_event_id: input.sourceEventId,
          source_event_type: input.sourceEventType,
          source_payload_hash: input.sourcePayloadHash,
          allocation_policy_hash: policyHash,
          ledger_idempotency_key: `repayment:${repaymentId}:ledger`,
        });
        await tx("loan_repayment_allocation_batches").insert({
          id: batchId,
          tenant_id: input.tenantId,
          repayment_id: repaymentId,
          loan_id: input.loanId,
          product_version_id: loan.product_version_id,
          status: "LEDGER_POSTING",
          amount: amount.toString(),
          allocated_amount: allocation.allocated.toString(),
          unapplied_amount: allocation.unapplied.toString(),
          currency: "NGN",
          allocation_order: JSON.stringify(order),
          policy_hash: policyHash,
          input_hash: requestHash,
          output_hash: outputHash,
          ledger_idempotency_key: `repayment:${repaymentId}:ledger`,
        });
        if (allocation.lines.length)
          await tx("loan_repayment_allocation_lines").insert(
            allocation.lines.map((line, index) => ({
              tenant_id: input.tenantId,
              batch_id: batchId,
              installment_id: line.installmentId,
              sequence_number: index + 1,
              component: line.component,
              amount: line.amount.toString(),
            })),
          );
        await tx("loan_repayment_lifecycle_history").insert({
          tenant_id: input.tenantId,
          repayment_id: repaymentId,
          previous_status: null,
          new_status: "LEDGER_POSTING",
          correlation_id: input.correlationId,
        });
        return {
          repayment: {
            id: repaymentId,
            request_hash: requestHash,
            status: "LEDGER_POSTING",
            ledger_idempotency_key: `repayment:${repaymentId}:ledger`,
          },
          batch: { id: batchId, ...allocation },
          lines: allocation.lines,
          replayed: false,
        };
      },
    );
    if (prepared.replayed)
      return {
        repaymentId: prepared.repayment.id,
        status: "SUCCESSFUL" as const,
        replayed: true,
      };
    if (!prepared.batch)
      throw new Error("Repayment allocation batch is missing");
    const batch = prepared.batch;
    const posting = await this.ledger.post({
      tenantId: input.tenantId,
      idempotencyKey: prepared.repayment.ledger_idempotency_key,
      reference: `REPAYMENT-${prepared.repayment.id}`,
      currency: "NGN",
      debitAccountId: input.cashLedgerAccountId,
      creditLines: [
        ...(batch.allocated > 0n
          ? [
              {
                accountId: input.receivableLedgerAccountId,
                amountMinor: batch.allocated.toString(),
              },
            ]
          : []),
        ...(batch.unapplied > 0n
          ? [
              {
                accountId: input.unappliedCreditLedgerAccountId,
                amountMinor: batch.unapplied.toString(),
              },
            ]
          : []),
      ],
      amountMinor: input.amountMinor,
    });
    await withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const repayment = (await tx("loan_repayments")
        .where({ tenant_id: input.tenantId, id: prepared.repayment.id })
        .forUpdate()
        .first()) as RepaymentRow;
      if (repayment.status === "SUCCESSFUL") return;
      const lines = (await tx("loan_repayment_allocation_lines")
        .where({ tenant_id: input.tenantId, batch_id: batch.id })
        .orderBy("sequence_number")) as AllocationLineRow[];
      for (const line of lines) {
        const column = {
          PENALTY: "penalty_paid",
          FEES: "fees_paid",
          INTEREST: "interest_paid",
          PRINCIPAL: "principal_paid",
        }[line.component];
        await tx.raw(
          `UPDATE public.loan_installments SET ${column}=${column}+?, total_paid=total_paid+?
           WHERE tenant_id=? AND id=?`,
          [line.amount, line.amount, input.tenantId, line.installment_id],
        );
      }
      const allocated = batch.allocated;
      const unapplied = batch.unapplied;
      const totals = { PRINCIPAL: 0n, INTEREST: 0n, FEES: 0n, PENALTY: 0n };
      for (const line of lines) totals[line.component] += BigInt(line.amount);
      const updatedLoans = await tx.raw<{ rowCount: number }>(
        `UPDATE public.loans SET
          outstanding_principal=outstanding_principal-?, outstanding_interest=outstanding_interest-?,
          outstanding_fees=outstanding_fees-?, outstanding_penalties=outstanding_penalties-?,
          total_repaid=total_repaid+?, last_repayment_date=current_date,
          status=CASE WHEN outstanding_principal-?=0 AND outstanding_interest-?=0
            AND outstanding_fees-?=0 AND outstanding_penalties-?=0 THEN 'SETTLED'::public.loan_status_enum
            WHEN status='DISBURSED' THEN 'ACTIVE'::public.loan_status_enum ELSE status END,
          closed_at=CASE WHEN outstanding_principal-?=0 AND outstanding_interest-?=0
            AND outstanding_fees-?=0 AND outstanding_penalties-?=0 THEN now() ELSE closed_at END
          WHERE tenant_id=? AND id=?
            AND outstanding_principal>=? AND outstanding_interest>=? AND outstanding_fees>=? AND outstanding_penalties>=?`,
        [
          totals.PRINCIPAL.toString(),
          totals.INTEREST.toString(),
          totals.FEES.toString(),
          totals.PENALTY.toString(),
          allocated.toString(),
          totals.PRINCIPAL.toString(),
          totals.INTEREST.toString(),
          totals.FEES.toString(),
          totals.PENALTY.toString(),
          totals.PRINCIPAL.toString(),
          totals.INTEREST.toString(),
          totals.FEES.toString(),
          totals.PENALTY.toString(),
          input.tenantId,
          input.loanId,
          totals.PRINCIPAL.toString(),
          totals.INTEREST.toString(),
          totals.FEES.toString(),
          totals.PENALTY.toString(),
        ],
      );
      if (updatedLoans.rowCount !== 1)
        throw new Error(
          "Loan outstanding balances do not match the repayment schedule",
        );
      if (unapplied > 0n)
        await tx("loan_unapplied_credits").insert({
          tenant_id: input.tenantId,
          repayment_id: repayment.id,
          loan_id: input.loanId,
          amount: unapplied.toString(),
          currency: "NGN",
          ledger_account_id: input.unappliedCreditLedgerAccountId,
          ledger_transaction_id: posting.transactionId,
        });
      await tx("loan_repayment_allocation_batches")
        .where({ tenant_id: input.tenantId, id: batch.id })
        .update({
          status: "APPLIED",
          ledger_transaction_id: posting.transactionId,
          applied_at: tx.fn.now(),
          version: tx.raw("version+1"),
        });
      await tx("loan_repayments")
        .where({ tenant_id: input.tenantId, id: repayment.id })
        .update({
          status: "SUCCESSFUL",
          ledger_transaction_id: posting.transactionId,
          processed_at: tx.fn.now(),
          version: tx.raw("version+1"),
        });
      await tx("loan_repayment_lifecycle_history").insert({
        tenant_id: input.tenantId,
        repayment_id: repayment.id,
        previous_status: "LEDGER_POSTING",
        new_status: "SUCCESSFUL",
        correlation_id: input.correlationId,
      });
      await tx("loan_outbox_events").insert({
        tenant_id: input.tenantId,
        aggregate_type: "loan_repayment",
        aggregate_id: repayment.id,
        event_type: "loan.repayment-allocated.v1",
        event_version: 1,
        idempotency_key: `repayment:${repayment.id}:allocated`,
        correlation_id: input.correlationId,
        payload: {
          loan_id: input.loanId,
          repayment_id: repayment.id,
          payment_id: input.paymentId,
          ledger_transaction_id: posting.transactionId,
          amount_minor: input.amountMinor,
          allocated_amount_minor: allocated.toString(),
          unapplied_amount_minor: unapplied.toString(),
          currency: "NGN",
        },
      });
    });
    return {
      repaymentId: prepared.repayment.id,
      status: "SUCCESSFUL" as const,
      replayed: posting.replayed,
    };
  }
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

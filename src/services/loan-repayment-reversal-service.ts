import { randomUUID } from "node:crypto";
import type { Knex } from "knex";
import { withTenantTransaction } from "../database/client.js";
import type {
  RepaymentComponent,
  RepaymentLedgerGateway,
} from "./loan-repayment-service.js";

interface Prepared {
  id: string;
  status: string;
  allocation_batch_id: string;
  loan_id: string;
  amount: string;
  original_ledger_transaction_id: string;
}

export class LoanRepaymentReversalService {
  constructor(
    private readonly db: Knex,
    private readonly ledger: RepaymentLedgerGateway,
  ) {}

  async reverse(input: {
    tenantId: string;
    repaymentId: string;
    reason: string;
    authorityType: "APPROVAL" | "AUTOMATED_RULE";
    authorityId: string;
    authorityPayloadHash: string;
    correlationId: string;
  }) {
    if (!/^[a-f0-9]{64}$/.test(input.authorityPayloadHash))
      throw new Error("Authority payload hash must be SHA-256");
    const prepared = await withTenantTransaction(
      this.db,
      input.tenantId,
      async (tx): Promise<Prepared> => {
        const existing = await tx("loan_repayment_reversals as r")
          .join("loan_repayments as p", function () {
            this.on("p.id", "=", "r.repayment_id").andOn(
              "p.tenant_id",
              "=",
              "r.tenant_id",
            );
          })
          .where({
            "r.tenant_id": input.tenantId,
            "r.repayment_id": input.repaymentId,
          })
          .first<
            Prepared & {
              authority_type: string;
              authority_id: string;
              authority_payload_hash: string;
            }
          >({
            id: "r.id",
            status: "r.status",
            allocation_batch_id: "r.allocation_batch_id",
            authority_type: "r.authority_type",
            authority_id: "r.authority_id",
            authority_payload_hash: "r.authority_payload_hash",
            loan_id: "p.loan_id",
            amount: "p.amount",
            original_ledger_transaction_id: "p.ledger_transaction_id",
          });
        if (existing) {
          if (
            existing.authority_type !== input.authorityType ||
            existing.authority_id !== input.authorityId ||
            existing.authority_payload_hash !== input.authorityPayloadHash
          )
            throw new Error(
              "Repayment already has a different reversal command",
            );
          return existing;
        }
        const repayment = await tx("loan_repayments")
          .where({
            tenant_id: input.tenantId,
            id: input.repaymentId,
            status: "SUCCESSFUL",
          })
          .forUpdate()
          .first<{
            loan_id: string;
            amount: string;
            ledger_transaction_id: string;
          }>();
        if (!repayment?.ledger_transaction_id)
          throw new Error("Successful posted repayment not found");
        const batch = await tx("loan_repayment_allocation_batches")
          .where({
            tenant_id: input.tenantId,
            repayment_id: input.repaymentId,
            status: "APPLIED",
          })
          .first<{ id: string }>();
        if (!batch) throw new Error("Applied repayment allocation not found");
        const id = randomUUID();
        await tx("loan_repayment_reversals").insert({
          id,
          tenant_id: input.tenantId,
          repayment_id: input.repaymentId,
          allocation_batch_id: batch.id,
          reason: input.reason,
          authority_type: input.authorityType,
          authority_id: input.authorityId,
          authority_payload_hash: input.authorityPayloadHash,
          status: "PENDING",
        });
        return {
          id,
          status: "PENDING",
          allocation_batch_id: batch.id,
          loan_id: repayment.loan_id,
          amount: repayment.amount,
          original_ledger_transaction_id: repayment.ledger_transaction_id,
        };
      },
    );
    if (prepared.status === "POSTED")
      return { id: prepared.id, status: "POSTED" as const, replayed: true };
    const posting = await this.ledger.reverse({
      tenantId: input.tenantId,
      transactionId: prepared.original_ledger_transaction_id,
      idempotencyKey: `repayment:${input.repaymentId}:reversal`,
      reason: input.reason,
      authorityType: input.authorityType,
      authorityId: input.authorityId,
    });
    await withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const current = await tx("loan_repayment_reversals")
        .where({ tenant_id: input.tenantId, id: prepared.id })
        .forUpdate()
        .first<{ status: string }>();
      if (!current || current.status === "POSTED") return;
      const lines = await tx("loan_repayment_allocation_lines")
        .where({
          tenant_id: input.tenantId,
          batch_id: prepared.allocation_batch_id,
        })
        .select<
          Array<{
            installment_id: string;
            component: RepaymentComponent;
            amount: string;
          }>
        >();
      const totals: Record<RepaymentComponent, bigint> = {
        PRINCIPAL: 0n,
        INTEREST: 0n,
        FEES: 0n,
        PENALTY: 0n,
      };
      for (const line of lines) {
        totals[line.component] += BigInt(line.amount);
        const column = {
          PENALTY: "penalty_paid",
          FEES: "fees_paid",
          INTEREST: "interest_paid",
          PRINCIPAL: "principal_paid",
        }[line.component];
        const changed = await tx.raw<{ rowCount: number }>(
          `UPDATE public.loan_installments SET ${column}=${column}-?,total_paid=total_paid-? WHERE tenant_id=? AND id=? AND ${column}>=? AND total_paid>=?`,
          [
            line.amount,
            line.amount,
            input.tenantId,
            line.installment_id,
            line.amount,
            line.amount,
          ],
        );
        if (changed.rowCount !== 1)
          throw new Error("Installment balance cannot be reversed safely");
      }
      const batch = await tx("loan_repayment_allocation_batches")
        .where({ tenant_id: input.tenantId, id: prepared.allocation_batch_id })
        .first<{ allocated_amount: string }>();
      if (!batch) throw new Error("Repayment allocation batch not found");
      await tx("loan_repayment_reversals")
        .where({ tenant_id: input.tenantId, id: prepared.id })
        .update({
          status: "POSTED",
          ledger_transaction_id: posting.transactionId,
          posted_at: tx.fn.now(),
        });
      await tx("loan_repayment_allocation_batches")
        .where({ tenant_id: input.tenantId, id: prepared.allocation_batch_id })
        .update({ status: "REVERSED", version: tx.raw("version+1") });
      await tx("loan_repayments")
        .where({ tenant_id: input.tenantId, id: input.repaymentId })
        .update({ status: "REVERSED", version: tx.raw("version+1") });
      await tx("loans")
        .where({ tenant_id: input.tenantId, id: prepared.loan_id })
        .update({
          outstanding_principal: tx.raw("outstanding_principal+?", [
            totals.PRINCIPAL.toString(),
          ]),
          outstanding_interest: tx.raw("outstanding_interest+?", [
            totals.INTEREST.toString(),
          ]),
          outstanding_fees: tx.raw("outstanding_fees+?", [
            totals.FEES.toString(),
          ]),
          outstanding_penalties: tx.raw("outstanding_penalties+?", [
            totals.PENALTY.toString(),
          ]),
          total_repaid: tx.raw("total_repaid-?", [batch.allocated_amount]),
          status: tx.raw(
            "CASE WHEN days_past_due>0 THEN 'OVERDUE'::public.loan_status_enum ELSE 'ACTIVE'::public.loan_status_enum END",
          ),
          closed_at: null,
        });
      await tx("loan_unapplied_credits")
        .where({
          tenant_id: input.tenantId,
          repayment_id: input.repaymentId,
          status: "AVAILABLE",
        })
        .update({ status: "REFUNDED" });
      await tx("loan_repayment_lifecycle_history").insert({
        tenant_id: input.tenantId,
        repayment_id: input.repaymentId,
        previous_status: "SUCCESSFUL",
        new_status: "REVERSED",
        reason_code: input.reason.slice(0, 100),
        correlation_id: input.correlationId,
      });
      await tx("loan_outbox_events").insert({
        tenant_id: input.tenantId,
        aggregate_type: "loan_repayment",
        aggregate_id: input.repaymentId,
        event_type: "loan.repayment-reversed.v1",
        event_version: 1,
        idempotency_key: `repayment:${input.repaymentId}:reversed`,
        correlation_id: input.correlationId,
        payload: {
          loan_id: prepared.loan_id,
          repayment_id: input.repaymentId,
          reversal_id: prepared.id,
          ledger_transaction_id: posting.transactionId,
          amount_minor: prepared.amount,
          currency: "NGN",
          authority_type: input.authorityType,
          authority_id: input.authorityId,
        },
      });
    });
    return {
      id: prepared.id,
      status: "POSTED" as const,
      replayed: posting.replayed,
    };
  }
}

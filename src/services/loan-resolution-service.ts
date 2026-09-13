import { createHash, randomUUID } from "node:crypto";
import type { Knex } from "knex";
import { withTenantTransaction } from "../database/client.js";
import type { LendingApprovalGateway } from "./approval-gateway.js";
import {
  allocateWriteoffRecovery,
  isWriteoffEligible,
  total,
  type ComponentBalances,
} from "./loan-resolution-calculator.js";

export interface ResolutionLedgerGateway {
  postWriteOff(input: {
    tenantId: string;
    idempotencyKey: string;
    reference: string;
    currency: "NGN";
    balances: Record<keyof ComponentBalances, string>;
    expenseLedgerAccountId: string;
    receivableLedgerAccountIds: Record<keyof ComponentBalances, string>;
  }): Promise<{ transactionId: string; replayed: boolean }>;
  postRecovery(input: {
    tenantId: string;
    idempotencyKey: string;
    reference: string;
    currency: "NGN";
    allocations: Record<keyof ComponentBalances, string>;
    cashLedgerAccountId: string;
    recoveryLedgerAccountIds: Record<keyof ComponentBalances, string>;
  }): Promise<{ transactionId: string; replayed: boolean }>;
}

interface WriteOffSource {
  product_version_id: string;
  days_past_due: number;
  outstanding_principal: string;
  outstanding_interest: string;
  outstanding_fees: string;
  outstanding_penalties: string;
  writeoff_eligibility: { minimum_dpd: number } | string;
}

interface WriteOffRow {
  id: string;
  request_hash: string;
  status: string;
  principal_amount: string;
  interest_amount: string;
  fees_amount: string;
  penalties_amount: string;
  approval_payload_hash: string | null;
  ledger_idempotency_key: string | null;
  ledger_transaction_id: string | null;
}

export class LoanResolutionService {
  constructor(
    private readonly db: Knex,
    private readonly approvals: LendingApprovalGateway,
    private readonly ledger: ResolutionLedgerGateway,
  ) {}

  async writeOff(input: {
    tenantId: string;
    loanId: string;
    approvalId: string;
    executorId: string;
    reasonCode: string;
    expenseLedgerAccountId: string;
    receivableLedgerAccountIds: Record<keyof ComponentBalances, string>;
    idempotencyKey: string;
    correlationId: string;
  }) {
    const requestHash = hash({
      loanId: input.loanId,
      approvalId: input.approvalId,
      executorId: input.executorId,
      reasonCode: input.reasonCode,
      expenseLedgerAccountId: input.expenseLedgerAccountId,
      receivableLedgerAccountIds: input.receivableLedgerAccountIds,
    });
    const prepared = await withTenantTransaction(
      this.db,
      input.tenantId,
      async (tx): Promise<WriteOffRow> => {
        const existing = await tx("loan_write_offs")
          .where({
            tenant_id: input.tenantId,
            idempotency_key: input.idempotencyKey,
          })
          .first<WriteOffRow>();
        if (existing) {
          if (existing.request_hash !== requestHash)
            throw new Error(
              "Idempotency key reused with a different write-off command",
            );
          return existing;
        }
        const source = await tx("loans as l")
          .join("loan_product_versions as pv", function () {
            this.on("pv.id", "=", "l.loan_product_version_id").andOn(
              "pv.tenant_id",
              "=",
              "l.tenant_id",
            );
          })
          .where({ "l.tenant_id": input.tenantId, "l.id": input.loanId })
          .whereIn("l.status", ["ACTIVE", "OVERDUE"])
          .forUpdate()
          .first<WriteOffSource>({
            product_version_id: "l.loan_product_version_id",
            days_past_due: "l.days_past_due",
            outstanding_principal: "l.outstanding_principal",
            outstanding_interest: "l.outstanding_interest",
            outstanding_fees: "l.outstanding_fees",
            outstanding_penalties: "l.outstanding_penalties",
            writeoff_eligibility: "pv.writeoff_eligibility",
          });
        if (!source) throw new Error("Write-off eligible loan not found");
        const eligibility = parseEligibility(source.writeoff_eligibility);
        const balances = balancesFrom(source);
        if (
          !isWriteoffEligible({
            daysPastDue: source.days_past_due,
            minimumDaysPastDue: eligibility.minimum_dpd,
            outstanding: balances,
          })
        )
          throw new Error(
            "Loan does not meet the published write-off eligibility policy",
          );
        const id = randomUUID();
        await tx("loan_write_offs").insert({
          id,
          tenant_id: input.tenantId,
          loan_id: input.loanId,
          product_version_id: source.product_version_id,
          principal_amount: balances.principal.toString(),
          interest_amount: balances.interest.toString(),
          fees_amount: balances.fees.toString(),
          penalties_amount: balances.penalty.toString(),
          total_amount: total(balances).toString(),
          currency: "NGN",
          reason: input.reasonCode,
          status: "APPROVAL_PENDING",
          requested_by: input.executorId,
          executor_id: input.executorId,
          eligibility_snapshot: JSON.stringify({
            days_past_due: source.days_past_due,
            minimum_dpd: eligibility.minimum_dpd,
          }),
          balance_snapshot_hash: hash(wireBalances(balances)),
          approval_id: input.approvalId,
          idempotency_key: input.idempotencyKey,
          request_hash: requestHash,
          correlation_id: input.correlationId,
          ledger_idempotency_key: `writeoff:${id}:ledger`,
        });
        await tx("loan_writeoff_history").insert({
          tenant_id: input.tenantId,
          writeoff_id: id,
          previous_status: null,
          new_status: "APPROVAL_PENDING",
          actor_id: input.executorId,
          reason_code: input.reasonCode,
        });
        const created = await tx("loan_write_offs")
          .where({ tenant_id: input.tenantId, id })
          .first<WriteOffRow>();
        if (!created) throw new Error("Write-off command was not persisted");
        return created;
      },
    );
    if (prepared.status === "COMPLETED")
      return { id: prepared.id, status: "COMPLETED" as const, replayed: true };
    const balances: ComponentBalances = {
      principal: BigInt(prepared.principal_amount),
      interest: BigInt(prepared.interest_amount),
      fees: BigInt(prepared.fees_amount),
      penalty: BigInt(prepared.penalties_amount),
    };
    const payloadHash = hash({
      loan_id: input.loanId,
      writeoff_id: prepared.id,
      balances: wireBalances(balances),
      reason_code: input.reasonCode,
    });
    const approval = await this.approvals.consume({
      tenantId: input.tenantId,
      approvalId: input.approvalId,
      action: "LOAN_WRITE_OFF",
      resourceType: "loan_write_off",
      resourceId: prepared.id,
      payloadHash,
      idempotencyKey: `${input.idempotencyKey}:approval`,
      correlationId: input.correlationId,
    });
    if (
      !approval.makerId ||
      !approval.checkerIds?.length ||
      !approval.consumedAt ||
      (approval.authorityLevel ?? 0) < 2
    )
      throw new Error("Senior maker-checker approval evidence is incomplete");
    const makerId = approval.makerId;
    const checkerIds = approval.checkerIds;
    const consumedAt = approval.consumedAt;
    if (makerId === input.executorId || checkerIds.includes(input.executorId))
      throw new Error(
        "Write-off executor must be separate from maker and checkers",
      );
    await withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const current = await tx("loan_write_offs")
        .where({ tenant_id: input.tenantId, id: prepared.id })
        .forUpdate()
        .first<WriteOffRow>();
      if (!current || current.status === "COMPLETED") return;
      await tx("loan_write_offs")
        .where({ tenant_id: input.tenantId, id: prepared.id })
        .update({
          status: "LEDGER_POSTING",
          approval_payload_hash: payloadHash,
          approval_consumed_at: consumedAt,
          approval_maker_id: makerId,
          approval_checker_ids: JSON.stringify(checkerIds),
          approved_authority_level: approval.authorityLevel,
          approved_by: checkerIds[0],
        });
      await tx("loan_writeoff_history").insert({
        tenant_id: input.tenantId,
        writeoff_id: prepared.id,
        previous_status: current.status,
        new_status: "LEDGER_POSTING",
        actor_id: input.executorId,
        reason_code: input.reasonCode,
      });
    });
    const posting = await this.ledger.postWriteOff({
      tenantId: input.tenantId,
      idempotencyKey:
        prepared.ledger_idempotency_key ?? `writeoff:${prepared.id}:ledger`,
      reference: `WO-${prepared.id}`,
      currency: "NGN",
      balances: wireBalances(balances),
      expenseLedgerAccountId: input.expenseLedgerAccountId,
      receivableLedgerAccountIds: input.receivableLedgerAccountIds,
    });
    await withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const current = await tx("loan_write_offs")
        .where({ tenant_id: input.tenantId, id: prepared.id })
        .forUpdate()
        .first<WriteOffRow>();
      if (!current || current.status === "COMPLETED") return;
      await tx("loan_write_offs")
        .where({ tenant_id: input.tenantId, id: prepared.id })
        .update({
          status: "COMPLETED",
          ledger_transaction_id: posting.transactionId,
          completed_at: tx.fn.now(),
        });
      await tx("loans")
        .where({ tenant_id: input.tenantId, id: input.loanId })
        .update({ status: "WRITTEN_OFF", closed_at: tx.fn.now() });
      await tx("loan_writeoff_history").insert({
        tenant_id: input.tenantId,
        writeoff_id: prepared.id,
        previous_status: current.status,
        new_status: "COMPLETED",
        actor_id: input.executorId,
        reason_code: input.reasonCode,
      });
      await tx("loan_outbox_events").insert({
        tenant_id: input.tenantId,
        aggregate_type: "loan",
        aggregate_id: input.loanId,
        event_type: "loan.written-off.v1",
        event_version: 1,
        idempotency_key: `writeoff:${prepared.id}:completed`,
        correlation_id: input.correlationId,
        payload: {
          loan_id: input.loanId,
          writeoff_id: prepared.id,
          total_amount_minor: total(balances).toString(),
          ledger_transaction_id: posting.transactionId,
          currency: "NGN",
        },
      });
    });
    return {
      id: prepared.id,
      status: "COMPLETED" as const,
      replayed: posting.replayed,
    };
  }

  async postWriteOffRecovery(input: {
    tenantId: string;
    loanId: string;
    writeOffId: string;
    paymentId: string;
    sourceEventId: string;
    sourcePayloadHash: string;
    amountMinor: string;
    method:
      | "BANK_TRANSFER"
      | "DIRECT_DEBIT"
      | "CARD"
      | "WALLET"
      | "CASH"
      | "PAYMENT_LINK"
      | "INTERNAL_ACCOUNT";
    cashLedgerAccountId: string;
    recoveryLedgerAccountIds: Record<keyof ComponentBalances, string>;
    idempotencyKey: string;
    correlationId: string;
    causationId: string;
  }) {
    const amount = BigInt(input.amountMinor);
    if (amount <= 0n) throw new Error("Recovery amount must be positive");
    const requestHash = hash({
      loanId: input.loanId,
      writeOffId: input.writeOffId,
      paymentId: input.paymentId,
      sourceEventId: input.sourceEventId,
      sourcePayloadHash: input.sourcePayloadHash,
      amountMinor: input.amountMinor,
      method: input.method,
    });
    const prepared = await withTenantTransaction(
      this.db,
      input.tenantId,
      async (tx) => {
        const replay = await tx("loan_write_off_recoveries")
          .where({
            tenant_id: input.tenantId,
            idempotency_key: input.idempotencyKey,
          })
          .first<{
            id: string;
            request_hash: string;
            status: string;
            allocation_snapshot: Record<string, string> | string;
            ledger_idempotency_key: string;
          }>();
        if (replay) {
          if (replay.request_hash !== requestHash)
            throw new Error(
              "Idempotency key reused with a different recovery command",
            );
          return replay;
        }
        const writeOff = await tx("loan_write_offs")
          .where({
            tenant_id: input.tenantId,
            id: input.writeOffId,
            loan_id: input.loanId,
            status: "COMPLETED",
          })
          .forUpdate()
          .first<{
            principal_amount: string;
            interest_amount: string;
            fees_amount: string;
            penalties_amount: string;
          }>();
        if (!writeOff) throw new Error("Completed write-off not found");
        const previous = await tx("loan_write_off_recoveries")
          .where({ tenant_id: input.tenantId, write_off_id: input.writeOffId })
          .whereIn("status", ["LEDGER_POSTING", "POSTED"])
          .select<{ allocation_snapshot: Record<string, string> | string }[]>(
            "allocation_snapshot",
          );
        const recovered = previous.reduce<ComponentBalances>(
          (sum, row) => {
            const value = parseAllocation(row.allocation_snapshot);
            return {
              principal: sum.principal + BigInt(value.principal),
              interest: sum.interest + BigInt(value.interest),
              fees: sum.fees + BigInt(value.fees),
              penalty: sum.penalty + BigInt(value.penalty),
            };
          },
          { principal: 0n, interest: 0n, fees: 0n, penalty: 0n },
        );
        const remaining: ComponentBalances = {
          principal: BigInt(writeOff.principal_amount) - recovered.principal,
          interest: BigInt(writeOff.interest_amount) - recovered.interest,
          fees: BigInt(writeOff.fees_amount) - recovered.fees,
          penalty: BigInt(writeOff.penalties_amount) - recovered.penalty,
        };
        const allocation = allocateWriteoffRecovery(amount, remaining);
        if (allocation.unapplied > 0n)
          throw new Error(
            "Recovery exceeds the remaining written-off obligation",
          );
        const id = randomUUID();
        const snapshot = wireBalances(allocation.allocated);
        const ledgerKey = `writeoff-recovery:${id}:ledger`;
        await tx("loan_write_off_recoveries").insert({
          id,
          tenant_id: input.tenantId,
          loan_id: input.loanId,
          write_off_id: input.writeOffId,
          recovery_reference: `WOR-${id}`,
          amount: input.amountMinor,
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
          source_payload_hash: input.sourcePayloadHash,
          allocation_snapshot: JSON.stringify(snapshot),
          ledger_idempotency_key: ledgerKey,
        });
        return {
          id,
          request_hash: requestHash,
          status: "LEDGER_POSTING",
          allocation_snapshot: snapshot,
          ledger_idempotency_key: ledgerKey,
        };
      },
    );
    if (prepared.status === "POSTED")
      return { id: prepared.id, status: "POSTED" as const, replayed: true };
    const allocation = parseAllocation(prepared.allocation_snapshot);
    const posting = await this.ledger.postRecovery({
      tenantId: input.tenantId,
      idempotencyKey: prepared.ledger_idempotency_key,
      reference: `WOR-${prepared.id}`,
      currency: "NGN",
      allocations: allocation,
      cashLedgerAccountId: input.cashLedgerAccountId,
      recoveryLedgerAccountIds: input.recoveryLedgerAccountIds,
    });
    await withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const current = await tx("loan_write_off_recoveries")
        .where({ tenant_id: input.tenantId, id: prepared.id })
        .forUpdate()
        .first<{ status: string }>();
      if (!current || current.status === "POSTED") return;
      await tx("loan_write_off_recoveries")
        .where({ tenant_id: input.tenantId, id: prepared.id })
        .update({
          status: "POSTED",
          ledger_transaction_id: posting.transactionId,
          posted_at: tx.fn.now(),
        });
      const changed = await tx("loan_write_offs")
        .where({ tenant_id: input.tenantId, id: input.writeOffId })
        .whereRaw("recovered_amount+?<=total_amount", [input.amountMinor])
        .update({
          recovered_amount: tx.raw("recovered_amount+?", [input.amountMinor]),
        });
      if (changed !== 1)
        throw new Error("Recovery exceeds the written-off obligation");
      await tx("loan_outbox_events").insert({
        tenant_id: input.tenantId,
        aggregate_type: "loan_writeoff",
        aggregate_id: input.writeOffId,
        event_type: "loan.writeoff-recovery-posted.v1",
        event_version: 1,
        idempotency_key: `writeoff-recovery:${prepared.id}:posted`,
        correlation_id: input.correlationId,
        payload: {
          loan_id: input.loanId,
          writeoff_id: input.writeOffId,
          recovery_id: prepared.id,
          payment_id: input.paymentId,
          amount_minor: input.amountMinor,
          ledger_transaction_id: posting.transactionId,
          currency: "NGN",
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

function balancesFrom(source: WriteOffSource): ComponentBalances {
  return {
    principal: BigInt(source.outstanding_principal),
    interest: BigInt(source.outstanding_interest),
    fees: BigInt(source.outstanding_fees),
    penalty: BigInt(source.outstanding_penalties),
  };
}
function wireBalances(
  value: ComponentBalances,
): Record<keyof ComponentBalances, string> {
  return {
    principal: value.principal.toString(),
    interest: value.interest.toString(),
    fees: value.fees.toString(),
    penalty: value.penalty.toString(),
  };
}
function parseEligibility(value: WriteOffSource["writeoff_eligibility"]): {
  minimum_dpd: number;
} {
  return typeof value === "string"
    ? (JSON.parse(value) as { minimum_dpd: number })
    : value;
}
function parseAllocation(
  value: Record<string, string> | string,
): Record<keyof ComponentBalances, string> {
  return typeof value === "string"
    ? (JSON.parse(value) as Record<keyof ComponentBalances, string>)
    : value;
}
function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

import { createHash, randomUUID } from "node:crypto";
import type { Knex } from "knex";
import { withTenantTransaction } from "../database/client.js";
import type { LendingApprovalGateway } from "./approval-gateway.js";
import { generateSchedule } from "./loan-offer-service.js";
import {
  validateRestructure,
  type ComponentBalances,
} from "./loan-resolution-calculator.js";

export interface RestructureLedgerGateway {
  postRestructure(input: {
    tenantId: string;
    idempotencyKey: string;
    reference: string;
    currency: "NGN";
    previousBalances: Record<keyof ComponentBalances, string>;
    newPrincipalMinor: string;
    newInterestMinor: string;
    receivableLedgerAccountId: string;
    adjustmentLedgerAccountId: string;
  }): Promise<{ transactionId: string; replayed: boolean }>;
}

interface Source {
  product_version_id: string;
  interest_rate: string;
  repayment_frequency:
    "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "BULLET";
  interest_type: "FLAT" | "REDUCING_BALANCE" | "DAILY_REDUCING_BALANCE";
  day_count_convention: string;
  outstanding_principal: string;
  outstanding_interest: string;
  outstanding_fees: string;
  outstanding_penalties: string;
  maturity_date: string | null;
  schedule_id: string;
  schedule_version: number;
  configuration_hash: string;
}

export class LoanRestructureService {
  constructor(
    private readonly db: Knex,
    private readonly approvals: LendingApprovalGateway,
    private readonly ledger: RestructureLedgerGateway,
  ) {}

  async restructure(input: {
    tenantId: string;
    loanId: string;
    approvalId: string;
    executorId: string;
    reasonCode: string;
    proposedTerms: {
      principalMinor: string;
      annualRate: string;
      tenureDays: number;
      effectiveDate: string;
      capitalizedAmountMinor: string;
      capitalizationAuthorized: boolean;
      principalReductionApprovalId?: string;
    };
    calculationPolicyVersion: string;
    receivableLedgerAccountId: string;
    adjustmentLedgerAccountId: string;
    idempotencyKey: string;
    correlationId: string;
  }) {
    const requestHash = hash({
      loanId: input.loanId,
      approvalId: input.approvalId,
      executorId: input.executorId,
      reasonCode: input.reasonCode,
      proposedTerms: input.proposedTerms,
      calculationPolicyVersion: input.calculationPolicyVersion,
    });
    const source = await this.source(input.tenantId, input.loanId);
    validateRestructure({
      previousPrincipal: BigInt(source.outstanding_principal),
      newPrincipal: BigInt(input.proposedTerms.principalMinor),
      ...(input.proposedTerms.principalReductionApprovalId
        ? {
            principalReductionApprovalId:
              input.proposedTerms.principalReductionApprovalId,
          }
        : {}),
      capitalizedAmount: BigInt(input.proposedTerms.capitalizedAmountMinor),
      capitalizationAuthorized: input.proposedTerms.capitalizationAuthorized,
    });
    const schedule = generateSchedule({
      principal: input.proposedTerms.principalMinor,
      annualRate: input.proposedTerms.annualRate,
      tenureDays: input.proposedTerms.tenureDays,
      effectiveDate: input.proposedTerms.effectiveDate,
      frequency: source.repayment_frequency,
      interestType: source.interest_type,
      dayCountConvention: source.day_count_convention,
      roundingMode: "HALF_EVEN",
      fees: [],
    });
    const balances: ComponentBalances = {
      principal: BigInt(source.outstanding_principal),
      interest: BigInt(source.outstanding_interest),
      fees: BigInt(source.outstanding_fees),
      penalty: BigInt(source.outstanding_penalties),
    };
    const evidence = {
      previous_balances: wireBalances(balances),
      proposed_terms: {
        principal_minor: input.proposedTerms.principalMinor,
        annual_rate: input.proposedTerms.annualRate,
        tenure_days: input.proposedTerms.tenureDays,
        effective_date: input.proposedTerms.effectiveDate,
        maturity_date: schedule.maturityDate,
        total_interest_minor: schedule.totalInterest.toString(),
      },
    };
    const prepared = await withTenantTransaction(
      this.db,
      input.tenantId,
      async (tx) => {
        const replay = await tx("loan_restructures")
          .where({
            tenant_id: input.tenantId,
            idempotency_key: input.idempotencyKey,
          })
          .first<{
            id: string;
            request_hash: string;
            status: string;
            new_schedule_id: string | null;
            ledger_idempotency_key: string;
          }>();
        if (replay) {
          if (replay.request_hash !== requestHash)
            throw new Error(
              "Idempotency key reused with a different restructure command",
            );
          return replay;
        }
        const id = randomUUID();
        await tx("loan_restructures").insert({
          id,
          tenant_id: input.tenantId,
          loan_id: input.loanId,
          previous_schedule_id: source.schedule_id,
          reason: input.reasonCode,
          previous_principal: source.outstanding_principal,
          new_principal: input.proposedTerms.principalMinor,
          previous_interest_rate: source.interest_rate,
          new_interest_rate: input.proposedTerms.annualRate,
          previous_maturity_date: source.maturity_date,
          new_maturity_date: schedule.maturityDate,
          status: "APPROVAL_PENDING",
          requested_by: input.executorId,
          executor_id: input.executorId,
          previous_balance_snapshot: JSON.stringify(evidence.previous_balances),
          proposed_terms: JSON.stringify(evidence.proposed_terms),
          calculation_policy_version: input.calculationPolicyVersion,
          calculation_input_hash: hash({
            source,
            proposedTerms: input.proposedTerms,
          }),
          calculation_output_hash: hash(evidence.proposed_terms),
          configuration_hash: source.configuration_hash,
          unrounded_total_interest: schedule.unroundedTotalInterest,
          rounding_mode: "HALF_EVEN",
          day_count_convention: source.day_count_convention,
          capitalization_authorized:
            input.proposedTerms.capitalizationAuthorized,
          approval_id: input.approvalId,
          idempotency_key: input.idempotencyKey,
          request_hash: requestHash,
          correlation_id: input.correlationId,
          ledger_idempotency_key: `restructure:${id}:ledger`,
        });
        await tx("loan_restructure_history").insert({
          tenant_id: input.tenantId,
          restructure_id: id,
          previous_status: null,
          new_status: "APPROVAL_PENDING",
          actor_id: input.executorId,
          reason_code: input.reasonCode,
        });
        return {
          id,
          request_hash: requestHash,
          status: "APPROVAL_PENDING",
          new_schedule_id: null,
          ledger_idempotency_key: `restructure:${id}:ledger`,
        };
      },
    );
    if (prepared.status === "IMPLEMENTED")
      return {
        id: prepared.id,
        scheduleId: prepared.new_schedule_id,
        status: "IMPLEMENTED" as const,
        replayed: true,
      };
    const payloadHash = hash({
      loan_id: input.loanId,
      restructure_id: prepared.id,
      ...evidence,
    });
    const approval = await this.approvals.consume({
      tenantId: input.tenantId,
      approvalId: input.approvalId,
      action: "LOAN_RESTRUCTURE",
      resourceType: "loan_restructure",
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
    if (makerId === input.executorId || checkerIds.includes(input.executorId))
      throw new Error(
        "Restructure executor must be separate from maker and checkers",
      );
    await withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const current = await tx("loan_restructures")
        .where({ tenant_id: input.tenantId, id: prepared.id })
        .forUpdate()
        .first<{ status: string }>();
      if (!current || current.status === "IMPLEMENTED") return;
      await tx("loan_restructures")
        .where({ tenant_id: input.tenantId, id: prepared.id })
        .update({
          status: "LEDGER_POSTING",
          approval_payload_hash: payloadHash,
          approval_consumed_at: approval.consumedAt,
          approval_maker_id: makerId,
          approval_checker_ids: JSON.stringify(checkerIds),
          approved_authority_level: approval.authorityLevel,
          approved_by: checkerIds[0],
          approved_at: tx.fn.now(),
        });
      await tx("loan_restructure_history").insert({
        tenant_id: input.tenantId,
        restructure_id: prepared.id,
        previous_status: current.status,
        new_status: "LEDGER_POSTING",
        actor_id: input.executorId,
        reason_code: input.reasonCode,
      });
    });
    const posting = await this.ledger.postRestructure({
      tenantId: input.tenantId,
      idempotencyKey: prepared.ledger_idempotency_key,
      reference: `RST-${prepared.id}`,
      currency: "NGN",
      previousBalances: wireBalances(balances),
      newPrincipalMinor: input.proposedTerms.principalMinor,
      newInterestMinor: schedule.totalInterest.toString(),
      receivableLedgerAccountId: input.receivableLedgerAccountId,
      adjustmentLedgerAccountId: input.adjustmentLedgerAccountId,
    });
    const scheduleId = await withTenantTransaction(
      this.db,
      input.tenantId,
      async (tx) => {
        const current = await tx("loan_restructures")
          .where({ tenant_id: input.tenantId, id: prepared.id })
          .forUpdate()
          .first<{ status: string; new_schedule_id: string | null }>();
        if (!current) throw new Error("Restructure command not found");
        if (current.status === "IMPLEMENTED" && current.new_schedule_id)
          return current.new_schedule_id;
        const id = randomUUID();
        await tx("loan_schedules")
          .where({
            tenant_id: input.tenantId,
            loan_id: input.loanId,
            is_active: true,
          })
          .update({ is_active: false });
        await tx("loan_schedules").insert({
          id,
          tenant_id: input.tenantId,
          loan_id: input.loanId,
          schedule_version: source.schedule_version + 1,
          effective_date: input.proposedTerms.effectiveDate,
          total_principal: input.proposedTerms.principalMinor,
          total_interest: schedule.totalInterest.toString(),
          total_fees: "0",
          total_amount: (
            BigInt(input.proposedTerms.principalMinor) + schedule.totalInterest
          ).toString(),
          is_active: true,
          calculation_version: input.calculationPolicyVersion,
          calculation_input_hash: hash({
            source,
            proposedTerms: input.proposedTerms,
          }),
          calculation_output_hash: hash(evidence.proposed_terms),
          rounding_mode: "HALF_EVEN",
          day_count_convention: source.day_count_convention,
          unrounded_total_interest: schedule.unroundedTotalInterest,
          rounding_residual: schedule.roundingResidual.toString(),
        });
        await tx("loan_installments").insert(
          schedule.installments.map((item) => ({
            tenant_id: input.tenantId,
            schedule_id: id,
            loan_id: input.loanId,
            installment_number: item.number,
            due_date: item.dueDate,
            principal_due: item.principal.toString(),
            interest_due: item.interest.toString(),
            fees_due: "0",
            penalty_due: "0",
            total_due: (item.principal + item.interest).toString(),
            period_start: item.periodStart,
            period_end: item.periodEnd,
            opening_principal: item.openingPrincipal.toString(),
            unrounded_interest: item.unroundedInterest,
            calculation_hash: item.calculationHash,
          })),
        );
        await tx("loans")
          .where({ tenant_id: input.tenantId, id: input.loanId })
          .update({
            outstanding_principal: input.proposedTerms.principalMinor,
            outstanding_interest: schedule.totalInterest.toString(),
            interest_rate: input.proposedTerms.annualRate,
            tenure_days: input.proposedTerms.tenureDays,
            maturity_date: schedule.maturityDate,
            next_payment_date: schedule.installments[0]?.dueDate,
          });
        await tx("loan_restructures")
          .where({ tenant_id: input.tenantId, id: prepared.id })
          .update({
            status: "IMPLEMENTED",
            new_schedule_id: id,
            ledger_transaction_id: posting.transactionId,
            implemented_at: tx.fn.now(),
          });
        await tx("loan_restructure_history").insert({
          tenant_id: input.tenantId,
          restructure_id: prepared.id,
          previous_status: current.status,
          new_status: "IMPLEMENTED",
          actor_id: input.executorId,
          reason_code: input.reasonCode,
        });
        await tx("loan_outbox_events").insert({
          tenant_id: input.tenantId,
          aggregate_type: "loan",
          aggregate_id: input.loanId,
          event_type: "loan.restructured.v1",
          event_version: 1,
          idempotency_key: `restructure:${prepared.id}:implemented`,
          correlation_id: input.correlationId,
          payload: {
            loan_id: input.loanId,
            restructure_id: prepared.id,
            new_schedule_id: id,
            ledger_transaction_id: posting.transactionId,
            currency: "NGN",
          },
        });
        return id;
      },
    );
    return {
      id: prepared.id,
      scheduleId,
      status: "IMPLEMENTED" as const,
      replayed: posting.replayed,
    };
  }

  private async source(tenantId: string, loanId: string): Promise<Source> {
    const row = await withTenantTransaction(this.db, tenantId, (tx) =>
      tx("loans as l")
        .join("loan_product_versions as pv", function () {
          this.on("pv.id", "=", "l.loan_product_version_id").andOn(
            "pv.tenant_id",
            "=",
            "l.tenant_id",
          );
        })
        .join("loan_schedules as s", function () {
          this.on("s.loan_id", "=", "l.id").andOn(
            "s.tenant_id",
            "=",
            "l.tenant_id",
          );
        })
        .where({ "l.tenant_id": tenantId, "l.id": loanId, "s.is_active": true })
        .whereIn("l.status", ["ACTIVE", "OVERDUE"])
        .first<Source>({
          product_version_id: "l.loan_product_version_id",
          interest_rate: "l.interest_rate",
          repayment_frequency: "l.repayment_frequency",
          interest_type: "l.interest_type",
          day_count_convention: "l.day_count_convention",
          outstanding_principal: "l.outstanding_principal",
          outstanding_interest: "l.outstanding_interest",
          outstanding_fees: "l.outstanding_fees",
          outstanding_penalties: "l.outstanding_penalties",
          maturity_date: "l.maturity_date",
          schedule_id: "s.id",
          schedule_version: "s.schedule_version",
          configuration_hash: "pv.configuration_hash",
        }),
    );
    if (!row) throw new Error("Active restructure-eligible loan not found");
    return row;
  }
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
function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

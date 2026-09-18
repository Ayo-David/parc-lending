import { createHash, randomUUID } from "node:crypto";
import type { Knex } from "knex";
import { withTenantTransaction } from "../database/client.js";
import {
  calculateDaysPastDue,
  calculateInterestAccrual,
  calculatePenalty,
  selectDelinquencyBucket,
  type ServicingRoundingMode,
} from "./loan-servicing-calculator.js";

export interface ServicingLedgerGateway {
  post(input: {
    tenantId: string;
    idempotencyKey: string;
    reference: string;
    currency: "NGN";
    debitAccountId: string;
    creditAccountId: string;
    amountMinor: string;
  }): Promise<{ transactionId: string; replayed: boolean }>;
}

interface LoanPolicyRow {
  product_version_id: string;
  outstanding_principal: string;
  outstanding_interest: string;
  outstanding_fees: string;
  outstanding_penalties: string;
  delinquency_bucket: string | null;
  interest_rate: string;
  day_count_convention: string;
  configuration_hash: string;
  late_payment_grace_period_days: number;
  delinquency_buckets: Array<{ code: string; minimum_dpd: number }> | string;
  penalty_type: "FIXED" | "PERCENTAGE" | null;
  penalty_rate: string | null;
  penalty_fixed_amount: string | null;
  penalty_cap_amount: string | null;
  penalty_frequency: "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY" | null;
  penalty_compounds: boolean;
}

export class LoanServicingService {
  constructor(
    private readonly db: Knex,
    private readonly ledger: ServicingLedgerGateway,
  ) {}

  async accrueInterest(input: {
    tenantId: string;
    loanId: string;
    installmentId: string;
    periodStart: string;
    periodEnd: string;
    assessmentDate: string;
    dayCountNumerator: number;
    dayCountDenominator: number;
    roundingMode: ServicingRoundingMode;
    calculationPolicyVersion: string;
    receivableLedgerAccountId: string;
    incomeLedgerAccountId: string;
    idempotencyKey: string;
    correlationId: string;
    causationId: string;
  }) {
    const source = await this.loanPolicy(input.tenantId, input.loanId);
    const calculation = calculateInterestAccrual({
      openingPrincipalMinor: BigInt(source.outstanding_principal),
      annualRate: source.interest_rate,
      dayCountNumerator: input.dayCountNumerator,
      dayCountDenominator: input.dayCountDenominator,
      roundingMode: input.roundingMode,
    });
    const calculationInput = {
      opening_principal_minor: source.outstanding_principal,
      annual_rate: source.interest_rate,
      day_count_numerator: input.dayCountNumerator,
      day_count_denominator: input.dayCountDenominator,
    };
    const existing = await withTenantTransaction(
      this.db,
      input.tenantId,
      (tx) =>
        tx("loan_interest_accruals")
          .where({
            tenant_id: input.tenantId,
            idempotency_key: input.idempotencyKey,
          })
          .first<{
            id: string;
            calculation_input_hash: string;
            status: string;
            ledger_transaction_id: string | null;
          }>(),
    );
    if (existing) {
      if (existing.calculation_input_hash !== hash(calculationInput))
        throw new Error("Idempotency key reused with a different accrual");
      return { id: existing.id, status: existing.status, replayed: true };
    }
    const id = randomUUID();
    await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loan_interest_accruals").insert({
        id,
        tenant_id: input.tenantId,
        loan_id: input.loanId,
        installment_id: input.installmentId,
        product_version_id: source.product_version_id,
        accrual_reference: `ACCR-${id}`,
        accrual_date: input.assessmentDate,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        opening_principal: source.outstanding_principal,
        annualized_rate: source.interest_rate,
        day_count_numerator: input.dayCountNumerator,
        day_count_denominator: input.dayCountDenominator,
        interest_amount: calculation.amountMinor.toString(),
        unrounded_interest: calculation.unroundedMinor,
        currency: "NGN",
        status: "POSTING",
        calculation_version: input.calculationPolicyVersion,
        calculation_policy_version: input.calculationPolicyVersion,
        calculation_data: JSON.stringify(calculationInput),
        rounding_mode: input.roundingMode,
        day_count_convention: source.day_count_convention,
        configuration_hash: source.configuration_hash,
        calculation_input_hash: hash(calculationInput),
        calculation_output_hash: hash(calculation),
        idempotency_key: input.idempotencyKey,
        correlation_id: input.correlationId,
        causation_id: input.causationId,
        ledger_idempotency_key: `accrual:${id}:ledger`,
      }),
    );
    const posting = await this.ledger.post({
      tenantId: input.tenantId,
      idempotencyKey: `accrual:${id}:ledger`,
      reference: `ACCR-${id}`,
      currency: "NGN",
      debitAccountId: input.receivableLedgerAccountId,
      creditAccountId: input.incomeLedgerAccountId,
      amountMinor: calculation.amountMinor.toString(),
    });
    await withTenantTransaction(this.db, input.tenantId, async (tx) => {
      await tx("loan_interest_accruals")
        .where({ tenant_id: input.tenantId, id })
        .update({
          status: "POSTED",
          ledger_transaction_id: posting.transactionId,
          posted_at: tx.fn.now(),
        });
      await tx("loans")
        .where({ tenant_id: input.tenantId, id: input.loanId })
        .update({
          outstanding_interest: tx.raw("outstanding_interest+?", [
            calculation.amountMinor.toString(),
          ]),
          accrued_through_date: input.periodEnd,
        });
      await tx("loan_installments")
        .where({ tenant_id: input.tenantId, id: input.installmentId })
        .update({
          interest_due: tx.raw("interest_due+?", [
            calculation.amountMinor.toString(),
          ]),
          total_due: tx.raw("total_due+?", [
            calculation.amountMinor.toString(),
          ]),
        });
      await this.outbox(
        tx,
        input.tenantId,
        input.loanId,
        "loan.interest-accrued.v1",
        `accrual:${id}:posted`,
        input.correlationId,
        {
          loan_id: input.loanId,
          accrual_id: id,
          period_start: input.periodStart,
          period_end: input.periodEnd,
          amount_minor: calculation.amountMinor.toString(),
          currency: "NGN",
          ledger_transaction_id: posting.transactionId,
        },
      );
    });
    return { id, status: "POSTED" as const, replayed: posting.replayed };
  }

  async assessDelinquency(input: {
    tenantId: string;
    loanId: string;
    assessmentDate: string;
    timezone: string;
    idempotencyKey: string;
    correlationId: string;
  }) {
    const source = await this.loanPolicy(input.tenantId, input.loanId);
    const oldest = await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loan_installments")
        .where({ tenant_id: input.tenantId, loan_id: input.loanId })
        .whereRaw("total_due>total_paid")
        .orderBy("due_date")
        .first<{ due_date: string; total_due: string; total_paid: string }>(),
    );
    const outstanding =
      BigInt(source.outstanding_principal) +
      BigInt(source.outstanding_interest) +
      BigInt(source.outstanding_fees) +
      BigInt(source.outstanding_penalties);
    const dpd = oldest
      ? calculateDaysPastDue({
          assessmentDate: input.assessmentDate,
          dueDate: databaseDate(oldest.due_date),
          gracePeriodDays: source.late_payment_grace_period_days,
          remainingAmountMinor:
            BigInt(oldest.total_due) - BigInt(oldest.total_paid),
        })
      : 0;
    const rawBuckets: Array<{ code: string; minimum_dpd: number }> =
      typeof source.delinquency_buckets === "string"
        ? (JSON.parse(source.delinquency_buckets) as Array<{
            code: string;
            minimum_dpd: number;
          }>)
        : source.delinquency_buckets;
    const buckets = rawBuckets.map((item) => ({
      code: item.code,
      minimumDpd: item.minimum_dpd,
    }));
    const bucket = selectDelinquencyBucket(dpd, buckets);
    return withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const replay = await tx("loan_delinquency_assessments")
        .where({
          tenant_id: input.tenantId,
          idempotency_key: input.idempotencyKey,
        })
        .first<{ id: string; bucket: string }>();
      if (replay)
        return { id: replay.id, bucket: replay.bucket, replayed: true };
      const id = randomUUID();
      await tx("loan_delinquency_assessments").insert({
        id,
        tenant_id: input.tenantId,
        loan_id: input.loanId,
        assessment_date: input.assessmentDate,
        days_past_due: dpd,
        previous_bucket: source.delinquency_bucket,
        bucket,
        oldest_unpaid_due_date: oldest?.due_date,
        grace_period_days: source.late_payment_grace_period_days,
        timezone: input.timezone,
        outstanding_amount: outstanding.toString(),
        policy_hash: hash(buckets),
        idempotency_key: input.idempotencyKey,
        correlation_id: input.correlationId,
      });
      await tx("loans")
        .where({ tenant_id: input.tenantId, id: input.loanId })
        .update({
          days_past_due: dpd,
          delinquency_bucket: bucket,
          status: dpd > 0 ? "OVERDUE" : tx.ref("status"),
        });
      if (bucket !== source.delinquency_bucket)
        await this.outbox(
          tx,
          input.tenantId,
          input.loanId,
          "loan.delinquency-changed.v1",
          `delinquency:${id}:changed`,
          input.correlationId,
          {
            loan_id: input.loanId,
            assessment_id: id,
            assessment_date: input.assessmentDate,
            days_past_due: dpd,
            previous_bucket: source.delinquency_bucket,
            bucket,
            outstanding_amount_minor: outstanding.toString(),
            currency: "NGN",
          },
        );
      return { id, bucket, replayed: false };
    });
  }

  async assessPenalty(input: {
    tenantId: string;
    loanId: string;
    installmentId: string;
    assessmentDate: string;
    periodStart: string;
    periodEnd: string;
    roundingMode: ServicingRoundingMode;
    calculationPolicyVersion: string;
    receivableLedgerAccountId: string;
    incomeLedgerAccountId: string;
    idempotencyKey: string;
    correlationId: string;
  }) {
    const source = await this.loanPolicy(input.tenantId, input.loanId);
    if (!source.penalty_type || !source.penalty_frequency)
      throw new Error("Published product version has no penalty policy");
    const installment = await withTenantTransaction(
      this.db,
      input.tenantId,
      (tx) =>
        tx("loan_installments")
          .where({
            tenant_id: input.tenantId,
            loan_id: input.loanId,
            id: input.installmentId,
          })
          .first<{
            due_date: string;
            principal_due: string;
            principal_paid: string;
            interest_due: string;
            interest_paid: string;
            fees_due: string;
            fees_paid: string;
          }>(),
    );
    if (!installment) throw new Error("Loan installment not found");
    // Penalties are excluded from their own basis: compounding remains disabled.
    const outstanding =
      BigInt(installment.principal_due) -
      BigInt(installment.principal_paid) +
      (BigInt(installment.interest_due) - BigInt(installment.interest_paid)) +
      (BigInt(installment.fees_due) - BigInt(installment.fees_paid));
    const dpd = calculateDaysPastDue({
      assessmentDate: input.assessmentDate,
      dueDate: databaseDate(installment.due_date),
      gracePeriodDays: source.late_payment_grace_period_days,
      remainingAmountMinor: outstanding,
    });
    if (dpd === 0) throw new Error("Installment is not penalty eligible");
    const cumulative = await withTenantTransaction(
      this.db,
      input.tenantId,
      async (tx) => {
        const replay = await tx("loan_penalty_assessments")
          .where({
            tenant_id: input.tenantId,
            idempotency_key: input.idempotencyKey,
          })
          .first<{
            id: string;
            calculation_input_hash: string;
            status: string;
          }>();
        const total = await tx("loan_penalty_assessments")
          .where({
            tenant_id: input.tenantId,
            installment_id: input.installmentId,
            status: "POSTED",
          })
          .sum<{ total: string | null }>("amount as total")
          .first();
        return { replay, amount: BigInt(total?.total ?? "0") };
      },
    );
    const calculationInput = {
      basis_amount_minor: outstanding.toString(),
      cumulative_before_minor: cumulative.amount.toString(),
      penalty_type: source.penalty_type,
      penalty_rate: source.penalty_rate,
      fixed_amount_minor: source.penalty_fixed_amount,
      cap_amount_minor: source.penalty_cap_amount,
    };
    if (cumulative.replay) {
      if (cumulative.replay.calculation_input_hash !== hash(calculationInput))
        throw new Error(
          "Idempotency key reused with a different penalty assessment",
        );
      return {
        id: cumulative.replay.id,
        status: cumulative.replay.status,
        replayed: true,
      };
    }
    const calculation = calculatePenalty({
      type: source.penalty_type,
      basisAmountMinor: outstanding,
      ...(source.penalty_rate === null ? {} : { rate: source.penalty_rate }),
      ...(source.penalty_fixed_amount === null
        ? {}
        : { fixedAmountMinor: BigInt(source.penalty_fixed_amount) }),
      cumulativeBeforeMinor: cumulative.amount,
      ...(source.penalty_cap_amount === null
        ? {}
        : { capAmountMinor: BigInt(source.penalty_cap_amount) }),
      roundingMode: input.roundingMode,
      compounds: false,
    });
    if (calculation.amountMinor === 0n)
      throw new Error("Penalty cap has been reached");
    const id = randomUUID();
    await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loan_penalty_assessments").insert({
        id,
        tenant_id: input.tenantId,
        loan_id: input.loanId,
        installment_id: input.installmentId,
        product_version_id: source.product_version_id,
        assessment_date: input.assessmentDate,
        assessment_period_start: input.periodStart,
        assessment_period_end: input.periodEnd,
        penalty_type: source.penalty_type,
        penalty_frequency: source.penalty_frequency,
        basis_amount: outstanding.toString(),
        penalty_rate:
          source.penalty_type === "PERCENTAGE" ? source.penalty_rate : null,
        fixed_amount:
          source.penalty_type === "FIXED" ? source.penalty_fixed_amount : null,
        unrounded_amount: calculation.unroundedMinor,
        amount: calculation.amountMinor.toString(),
        cumulative_before: cumulative.amount.toString(),
        cap_amount: source.penalty_cap_amount,
        grace_period_days: source.late_payment_grace_period_days,
        compounds: false,
        currency: "NGN",
        status: "POSTING",
        policy_hash: hash({
          type: source.penalty_type,
          rate: source.penalty_rate,
          fixed: source.penalty_fixed_amount,
          cap: source.penalty_cap_amount,
          frequency: source.penalty_frequency,
        }),
        calculation_input_hash: hash(calculationInput),
        calculation_output_hash: hash(calculation),
        rounding_mode: input.roundingMode,
        calculation_policy_version: input.calculationPolicyVersion,
        idempotency_key: input.idempotencyKey,
        correlation_id: input.correlationId,
        ledger_idempotency_key: `penalty:${id}:ledger`,
      }),
    );
    const posting = await this.ledger.post({
      tenantId: input.tenantId,
      idempotencyKey: `penalty:${id}:ledger`,
      reference: `PEN-${id}`,
      currency: "NGN",
      debitAccountId: input.receivableLedgerAccountId,
      creditAccountId: input.incomeLedgerAccountId,
      amountMinor: calculation.amountMinor.toString(),
    });
    await withTenantTransaction(this.db, input.tenantId, async (tx) => {
      await tx("loan_penalty_assessments")
        .where({ tenant_id: input.tenantId, id })
        .update({
          status: "POSTED",
          ledger_transaction_id: posting.transactionId,
          posted_at: tx.fn.now(),
        });
      await tx("loans")
        .where({ tenant_id: input.tenantId, id: input.loanId })
        .update({
          outstanding_penalties: tx.raw("outstanding_penalties+?", [
            calculation.amountMinor.toString(),
          ]),
        });
      await tx("loan_installments")
        .where({ tenant_id: input.tenantId, id: input.installmentId })
        .update({
          penalty_due: tx.raw("penalty_due+?", [
            calculation.amountMinor.toString(),
          ]),
          total_due: tx.raw("total_due+?", [
            calculation.amountMinor.toString(),
          ]),
        });
      await this.outbox(
        tx,
        input.tenantId,
        input.loanId,
        "loan.penalty-assessed.v1",
        `penalty:${id}:posted`,
        input.correlationId,
        {
          loan_id: input.loanId,
          installment_id: input.installmentId,
          penalty_assessment_id: id,
          assessment_date: input.assessmentDate,
          amount_minor: calculation.amountMinor.toString(),
          cumulative_amount_minor: (
            cumulative.amount + calculation.amountMinor
          ).toString(),
          currency: "NGN",
          ledger_transaction_id: posting.transactionId,
        },
      );
    });
    return { id, status: "POSTED" as const, replayed: posting.replayed };
  }

  private async loanPolicy(
    tenantId: string,
    loanId: string,
  ): Promise<LoanPolicyRow> {
    const row = await withTenantTransaction(this.db, tenantId, (tx) =>
      tx("loans as l")
        .join("loan_product_versions as pv", function () {
          this.on("pv.id", "=", "l.loan_product_version_id").andOn(
            "pv.tenant_id",
            "=",
            "l.tenant_id",
          );
        })
        .where({ "l.tenant_id": tenantId, "l.id": loanId })
        .whereIn("l.status", ["DISBURSED", "ACTIVE", "OVERDUE"])
        .first<LoanPolicyRow>({
          product_version_id: "l.loan_product_version_id",
          outstanding_principal: "l.outstanding_principal",
          outstanding_interest: "l.outstanding_interest",
          outstanding_fees: "l.outstanding_fees",
          outstanding_penalties: "l.outstanding_penalties",
          delinquency_bucket: "l.delinquency_bucket",
          interest_rate: "l.interest_rate",
          day_count_convention: "l.day_count_convention",
          configuration_hash: "pv.configuration_hash",
          late_payment_grace_period_days: "pv.late_payment_grace_period_days",
          delinquency_buckets: "pv.delinquency_buckets",
          penalty_type: "pv.penalty_type",
          penalty_rate: "pv.penalty_rate",
          penalty_fixed_amount: "pv.penalty_fixed_amount",
          penalty_cap_amount: "pv.penalty_cap_amount",
          penalty_frequency: "pv.penalty_frequency",
          penalty_compounds: "pv.penalty_compounds",
        }),
    );
    if (!row) throw new Error("Serviceable loan not found");
    return row;
  }

  private outbox(
    tx: Knex.Transaction,
    tenantId: string,
    loanId: string,
    eventType: string,
    idempotencyKey: string,
    correlationId: string,
    payload: Record<string, unknown>,
  ) {
    return tx("loan_outbox_events").insert({
      tenant_id: tenantId,
      aggregate_type: "loan",
      aggregate_id: loanId,
      event_type: eventType,
      event_version: 1,
      idempotency_key: idempotencyKey,
      correlation_id: correlationId,
      payload,
    });
  }
}

function databaseDate(value: string | Date): string {
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value).slice(0, 10);
}

function hash(value: unknown): string {
  return createHash("sha256")
    .update(
      JSON.stringify(value, (_key, item: unknown) =>
        typeof item === "bigint" ? item.toString() : item,
      ),
    )
    .digest("hex");
}

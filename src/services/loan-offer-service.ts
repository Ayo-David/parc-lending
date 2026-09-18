import { createHash, randomUUID } from "node:crypto";
import { Decimal } from "decimal.js";
import type { Knex } from "knex";
import { withTenantTransaction } from "../database/client.js";

type Frequency =
  "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "BULLET";
type InterestType = "FLAT" | "REDUCING_BALANCE" | "DAILY_REDUCING_BALANCE";
type RoundingMode = "HALF_EVEN" | "HALF_UP" | "DOWN";
interface FeeLine {
  code: string;
  description: string;
  amountMinor: string;
  treatment: "FINANCED" | "DEDUCTED_FROM_DISBURSEMENT";
}
interface Installment {
  number: number;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  openingPrincipal: bigint;
  principal: bigint;
  interest: bigint;
  fees: bigint;
  unroundedInterest: string;
  calculationHash: string;
}
interface AuthorizationEvidence {
  reference: string;
  customerId: string;
  subject: string;
}
export interface TransactionAuthorizationVerifier {
  verify(input: {
    tenantId: string;
    customerId: string;
    action: "ACCEPT_LOAN_OFFER";
    resourceId: string;
    token: string;
  }): Promise<AuthorizationEvidence>;
}

export class LoanOfferService {
  constructor(
    private readonly db: Knex,
    private readonly authorizations: TransactionAuthorizationVerifier,
  ) {}

  async issue(input: {
    tenantId: string;
    applicationId: string;
    effectiveDate: string;
    expiresAt: string;
    documentReference: string;
    documentHash: string;
    idempotencyKey: string;
    correlationId: string;
    actorId: string;
  }) {
    validateDate(input.effectiveDate);
    if (!/^[a-f0-9]{64}$/.test(input.documentHash))
      throw new Error("Document hash must be SHA-256");
    if (new Date(input.expiresAt).getTime() <= Date.now())
      throw new Error("Offer expiry must be in the future");
    return withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const requestHash = hash({
        applicationId: input.applicationId,
        effectiveDate: input.effectiveDate,
        expiresAt: input.expiresAt,
        documentReference: input.documentReference,
        documentHash: input.documentHash,
      });
      const replay = await tx("loan_offers")
        .where({
          tenant_id: input.tenantId,
          idempotency_key: input.idempotencyKey,
        })
        .first<{ id: string; request_hash: string }>();
      if (replay) {
        if (replay.request_hash !== requestHash)
          throw new Error("Idempotency key reused with different offer");
        return { id: replay.id, replayed: true };
      }
      const row = await tx("loan_applications as a")
        .join("loan_application_decisions as d", function () {
          this.on("d.application_id", "=", "a.id").andOn(
            "d.tenant_id",
            "=",
            "a.tenant_id",
          );
        })
        .join("loan_product_versions as v", function () {
          this.on("v.id", "=", "a.loan_product_version_id").andOn(
            "v.tenant_id",
            "=",
            "a.tenant_id",
          );
        })
        .where({
          "a.tenant_id": input.tenantId,
          "a.id": input.applicationId,
          "a.status": "APPROVED",
          "d.decision": "APPROVED",
        })
        .orderBy("d.decided_at", "desc")
        .forUpdate()
        .first<OfferSource>(
          "a.customer_id",
          "a.loan_product_id",
          "a.loan_product_version_id",
          "a.approved_amount",
          "a.approved_tenure_days",
          "a.approved_interest_rate",
          "d.id as decision_id",
          "v.interest_type",
          "v.interest_payment_method",
          "v.interest_rate_period",
          "v.repayment_frequency",
          "v.day_count_convention",
          "v.calculation_policy_version",
          "v.rounding_mode",
          "v.configuration_hash",
          "v.fee_snapshot",
        );
      if (
        !row?.approved_amount ||
        !row.approved_tenure_days ||
        row.approved_interest_rate === null
      )
        throw new Error("Approved application terms are incomplete");
      if (row.interest_type === "DAILY_REDUCING_BALANCE")
        throw new Error(
          "Daily reducing balance schedule generation is not enabled in LN-04",
        );
      const outstandingConditions = await tx(
        "loan_manual_decision_conditions as c",
      )
        .join("loan_manual_review_recommendations as r", function () {
          this.on("r.id", "=", "c.recommendation_id").andOn(
            "r.tenant_id",
            "=",
            "c.tenant_id",
          );
        })
        .where({
          "c.tenant_id": input.tenantId,
          "r.application_id": input.applicationId,
        })
        .whereNotIn("c.status", ["SATISFIED", "WAIVED"])
        .count<{ count: string }>("c.id as count")
        .first();
      if (Number(outstandingConditions?.count ?? 0) > 0)
        throw new Error("Underwriting conditions are outstanding");
      const fees = parseFees(row.fee_snapshot);
      const schedule = generateSchedule({
        principal: row.approved_amount,
        annualRate: row.approved_interest_rate,
        tenureDays: row.approved_tenure_days,
        effectiveDate: input.effectiveDate,
        frequency: row.repayment_frequency,
        interestType: row.interest_type,
        dayCountConvention: row.day_count_convention,
        roundingMode: row.rounding_mode,
        fees,
      });
      await tx("loan_offers")
        .where({
          tenant_id: input.tenantId,
          application_id: input.applicationId,
          status: "ISSUED",
        })
        .update({ status: "SUPERSEDED" });
      const latest = await tx("loan_offers")
        .where({
          tenant_id: input.tenantId,
          application_id: input.applicationId,
        })
        .max<{ max: string | null }>("version_number as max")
        .first();
      const id = randomUUID();
      const outputHash = hash(schedule.installments.map(wireInstallment));
      const inputHash = hash({
        principal: row.approved_amount,
        annualRate: row.approved_interest_rate,
        tenureDays: row.approved_tenure_days,
        effectiveDate: input.effectiveDate,
        frequency: row.repayment_frequency,
        interestType: row.interest_type,
        fees,
      });
      const financedFees = fees
        .filter((f) => f.treatment === "FINANCED")
        .reduce((sum, f) => sum + BigInt(f.amountMinor), 0n);
      const deductedFees = fees
        .filter((f) => f.treatment === "DEDUCTED_FROM_DISBURSEMENT")
        .reduce((sum, f) => sum + BigInt(f.amountMinor), 0n);
      await tx("loan_offers").insert({
        id,
        tenant_id: input.tenantId,
        application_id: input.applicationId,
        decision_id: row.decision_id,
        loan_product_version_id: row.loan_product_version_id,
        offer_reference: `OFFER-${id}`,
        version_number: Number(latest?.max ?? 0) + 1,
        status: "ISSUED",
        currency: "NGN",
        principal_amount: row.approved_amount,
        net_disbursement_amount: (
          BigInt(row.approved_amount) - deductedFees
        ).toString(),
        total_interest: schedule.totalInterest.toString(),
        total_fees: financedFees.toString(),
        total_repayable: (
          BigInt(row.approved_amount) +
          schedule.totalInterest +
          financedFees
        ).toString(),
        interest_rate: row.approved_interest_rate,
        interest_rate_period: row.interest_rate_period,
        interest_type: row.interest_type,
        interest_payment_method: row.interest_payment_method,
        repayment_frequency: row.repayment_frequency,
        tenure_days: row.approved_tenure_days,
        first_payment_date: schedule.installments[0]?.dueDate,
        maturity_date: schedule.maturityDate,
        terms: JSON.stringify({
          calculation_version: row.calculation_policy_version,
        }),
        conditions: "[]",
        issued_at: tx.fn.now(),
        expires_at: input.expiresAt,
        created_by: input.actorId,
        configuration_hash: row.configuration_hash,
        calculation_version: row.calculation_policy_version,
        calculation_input_hash: inputHash,
        calculation_output_hash: outputHash,
        rounding_mode: row.rounding_mode,
        day_count_convention: row.day_count_convention,
        unrounded_interest: schedule.unroundedTotalInterest,
        rounding_residual: schedule.roundingResidual.toString(),
        idempotency_key: input.idempotencyKey,
        request_hash: requestHash,
        correlation_id: input.correlationId,
        document_reference: input.documentReference,
        document_hash: input.documentHash,
      });
      if (fees.length)
        await tx("loan_offer_fee_lines").insert(
          fees.map((fee) => ({
            tenant_id: input.tenantId,
            offer_id: id,
            fee_code: fee.code,
            description: fee.description,
            amount: fee.amountMinor,
            treatment: fee.treatment,
          })),
        );
      const scheduleId = randomUUID();
      await tx("loan_offer_schedules").insert({
        id: scheduleId,
        tenant_id: input.tenantId,
        offer_id: id,
        effective_date: input.effectiveDate,
        maturity_date: schedule.maturityDate,
        total_principal: row.approved_amount,
        total_interest: schedule.totalInterest.toString(),
        total_fees: financedFees.toString(),
        total_amount: (
          BigInt(row.approved_amount) +
          schedule.totalInterest +
          financedFees
        ).toString(),
        currency: "NGN",
        calculation_version: row.calculation_policy_version,
        calculation_input_hash: inputHash,
        calculation_output_hash: outputHash,
        rounding_mode: row.rounding_mode,
        day_count_convention: row.day_count_convention,
        unrounded_total_interest: schedule.unroundedTotalInterest,
        rounding_residual: schedule.roundingResidual.toString(),
      });
      await tx("loan_offer_installments").insert(
        schedule.installments.map((item) => ({
          tenant_id: input.tenantId,
          schedule_id: scheduleId,
          installment_number: item.number,
          period_start: item.periodStart,
          period_end: item.periodEnd,
          due_date: item.dueDate,
          opening_principal: item.openingPrincipal.toString(),
          principal_due: item.principal.toString(),
          interest_due: item.interest.toString(),
          fees_due: item.fees.toString(),
          total_due: (item.principal + item.interest + item.fees).toString(),
          unrounded_interest: item.unroundedInterest,
          calculation_hash: item.calculationHash,
        })),
      );
      await tx("loan_outbox_events").insert({
        tenant_id: input.tenantId,
        aggregate_type: "loan_offer",
        aggregate_id: id,
        event_type: "loan.offer-issued.v1",
        event_version: 1,
        idempotency_key: `offer:${id}:issued`,
        correlation_id: input.correlationId,
        payload: {
          offer_id: id,
          application_id: input.applicationId,
          expires_at: input.expiresAt,
          document_hash: input.documentHash,
        },
      });
      return { id, replayed: false };
    });
  }

  async accept(input: {
    tenantId: string;
    offerId: string;
    offerVersion: number;
    customerId: string;
    authorizationToken: string;
    consentReference: string;
    documentHash: string;
    idempotencyKey: string;
    correlationId: string;
  }) {
    const authorization = await this.authorizations.verify({
      tenantId: input.tenantId,
      customerId: input.customerId,
      action: "ACCEPT_LOAN_OFFER",
      resourceId: input.offerId,
      token: input.authorizationToken,
    });
    if (authorization.customerId !== input.customerId)
      throw new Error("Authorization customer mismatch");
    const authorizationHash = createHash("sha256")
      .update(input.authorizationToken)
      .digest("hex");
    const requestHash = hash({
      offerId: input.offerId,
      offerVersion: input.offerVersion,
      customerId: input.customerId,
      authorizationReference: authorization.reference,
      consentReference: input.consentReference,
      documentHash: input.documentHash,
    });
    return withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const replay = await tx("loan_offer_acceptances")
        .where({
          tenant_id: input.tenantId,
          idempotency_key: input.idempotencyKey,
        })
        .first<{ id: string; offer_id: string; request_hash: string }>();
      if (replay) {
        if (replay.request_hash !== requestHash)
          throw new Error("Idempotency key reused with different acceptance");
        const loan = await tx("loans")
          .where({
            tenant_id: input.tenantId,
            accepted_offer_id: replay.offer_id,
          })
          .first<{ id: string }>("id");
        return { acceptanceId: replay.id, loanId: loan.id, replayed: true };
      }
      const offer = await tx("loan_offers as o")
        .join("loan_applications as a", function () {
          this.on("a.id", "=", "o.application_id").andOn(
            "a.tenant_id",
            "=",
            "o.tenant_id",
          );
        })
        .where({
          "o.tenant_id": input.tenantId,
          "o.id": input.offerId,
          "o.version_number": input.offerVersion,
          "a.customer_id": input.customerId,
        })
        .forUpdate()
        .first<AcceptableOffer>("o.*", "a.customer_id", "a.loan_product_id");
      if (!offer || offer.status !== "ISSUED")
        throw new Error("Current issued offer not found");
      if (new Date(offer.expires_at).getTime() <= Date.now()) {
        await tx("loan_offers")
          .where({ id: input.offerId })
          .update({ status: "EXPIRED" });
        throw new Error("Offer expired");
      }
      if (offer.document_hash.trim() !== input.documentHash)
        throw new Error("Accepted document hash mismatch");
      const offerSchedule = await tx("loan_offer_schedules")
        .where({ tenant_id: input.tenantId, offer_id: input.offerId })
        .first<OfferSchedule>();
      if (!offerSchedule) throw new Error("Offer schedule not found");
      const items = await tx("loan_offer_installments")
        .where({ tenant_id: input.tenantId, schedule_id: offerSchedule.id })
        .orderBy("installment_number")
        .select<OfferInstallment[]>("*");
      const acceptanceId = randomUUID();
      await tx("loan_offer_acceptances").insert({
        id: acceptanceId,
        tenant_id: input.tenantId,
        offer_id: input.offerId,
        customer_id: input.customerId,
        authorization_reference: authorization.reference,
        authorization_hash: authorizationHash,
        consent_reference: input.consentReference,
        accepted_document_hash: input.documentHash,
        idempotency_key: input.idempotencyKey,
        request_hash: requestHash,
        correlation_id: input.correlationId,
      });
      const loanId = randomUUID();
      await tx("loans").insert({
        id: loanId,
        tenant_id: input.tenantId,
        application_id: offer.application_id,
        customer_id: input.customerId,
        loan_product_id: offer.loan_product_id,
        loan_product_version_id: offer.loan_product_version_id,
        accepted_offer_id: input.offerId,
        loan_number: `LOAN-${loanId}`,
        currency: "NGN",
        principal_amount: offer.principal_amount,
        approved_amount: offer.principal_amount,
        interest_rate: offer.interest_rate,
        interest_type: offer.interest_type,
        tenure_days: offer.tenure_days,
        repayment_frequency: offer.repayment_frequency,
        status: "APPROVED",
        disbursed_amount: "0",
        outstanding_principal: offer.principal_amount,
        outstanding_interest: offer.total_interest,
        outstanding_fees: offer.total_fees,
        outstanding_penalties: "0",
        total_repaid: "0",
        maturity_date: offer.maturity_date,
        next_payment_date: offer.first_payment_date,
        interest_rate_period: offer.interest_rate_period,
        interest_payment_method: offer.interest_payment_method,
        day_count_convention: offer.day_count_convention,
        first_payment_date: offer.first_payment_date,
        created_by: authorization.subject,
      });
      const scheduleId = randomUUID();
      await tx("loan_schedules").insert({
        id: scheduleId,
        tenant_id: input.tenantId,
        loan_id: loanId,
        schedule_version: 1,
        effective_date: offerSchedule.effective_date,
        total_principal: offerSchedule.total_principal,
        total_interest: offerSchedule.total_interest,
        total_fees: offerSchedule.total_fees,
        total_amount: offerSchedule.total_amount,
        is_active: true,
        offer_schedule_id: offerSchedule.id,
        calculation_version: offerSchedule.calculation_version,
        calculation_input_hash: offerSchedule.calculation_input_hash,
        calculation_output_hash: offerSchedule.calculation_output_hash,
        rounding_mode: offerSchedule.rounding_mode,
        day_count_convention: offerSchedule.day_count_convention,
        unrounded_total_interest: offerSchedule.unrounded_total_interest,
        rounding_residual: offerSchedule.rounding_residual,
      });
      await tx("loan_installments").insert(
        items.map((item) => ({
          tenant_id: input.tenantId,
          schedule_id: scheduleId,
          loan_id: loanId,
          installment_number: item.installment_number,
          due_date: item.due_date,
          principal_due: item.principal_due,
          interest_due: item.interest_due,
          fees_due: item.fees_due,
          penalty_due: "0",
          total_due: item.total_due,
          principal_paid: "0",
          interest_paid: "0",
          fees_paid: "0",
          penalty_paid: "0",
          total_paid: "0",
          status: "PENDING",
          period_start: item.period_start,
          period_end: item.period_end,
          opening_principal: item.opening_principal,
          unrounded_interest: item.unrounded_interest,
          calculation_hash: item.calculation_hash,
        })),
      );
      const contractId = randomUUID();
      await tx("loan_contracts").insert({
        id: contractId,
        tenant_id: input.tenantId,
        loan_id: loanId,
        offer_id: input.offerId,
        acceptance_id: acceptanceId,
        contract_reference: `CONTRACT-${contractId}`,
        contract_version: 1,
        status: "SIGNED",
        document_reference: offer.document_reference,
        document_hash: offer.document_hash,
        terms_snapshot: offer.terms,
        borrower_consent_reference: input.consentReference,
        borrower_signed_at: tx.fn.now(),
        lender_signed_at: tx.fn.now(),
        effective_at: tx.fn.now(),
        authorization_reference: authorization.reference,
        authorization_hash: authorizationHash,
        consent_reference: input.consentReference,
        accepted_document_hash: input.documentHash,
        idempotency_key: input.idempotencyKey,
        request_hash: requestHash,
        correlation_id: input.correlationId,
      });
      await tx("loan_offers")
        .where({ tenant_id: input.tenantId, id: input.offerId })
        .update({ status: "ACCEPTED", accepted_at: tx.fn.now() });
      await tx("loan_outbox_events").insert({
        tenant_id: input.tenantId,
        aggregate_type: "loan_offer",
        aggregate_id: input.offerId,
        event_type: "loan.offer-accepted.v1",
        event_version: 1,
        idempotency_key: `offer:${input.offerId}:accepted`,
        correlation_id: input.correlationId,
        payload: {
          offer_id: input.offerId,
          application_id: offer.application_id,
          acceptance_id: acceptanceId,
          loan_id: loanId,
          contract_id: contractId,
          document_hash: input.documentHash,
        },
      });
      return { acceptanceId, loanId, contractId, replayed: false };
    });
  }
}

interface OfferSource {
  customer_id: string;
  loan_product_id: string;
  loan_product_version_id: string;
  approved_amount: string | null;
  approved_tenure_days: number | null;
  approved_interest_rate: string | null;
  decision_id: string;
  interest_type: InterestType;
  interest_payment_method: string;
  interest_rate_period: string;
  repayment_frequency: Frequency;
  day_count_convention: string;
  calculation_policy_version: string;
  rounding_mode: RoundingMode;
  configuration_hash: string;
  fee_snapshot: unknown;
}
interface AcceptableOffer {
  id: string;
  application_id: string;
  loan_product_id: string;
  loan_product_version_id: string;
  status: string;
  expires_at: Date;
  document_hash: string;
  document_reference: string;
  principal_amount: string;
  total_interest: string;
  total_fees: string;
  interest_rate: string;
  interest_type: string;
  interest_payment_method: string;
  interest_rate_period: string;
  repayment_frequency: string;
  tenure_days: number;
  maturity_date: string;
  first_payment_date: string;
  terms: unknown;
  day_count_convention: string;
}
interface OfferSchedule {
  id: string;
  effective_date: string;
  total_principal: string;
  total_interest: string;
  total_fees: string;
  total_amount: string;
  calculation_version: string;
  calculation_input_hash: string;
  calculation_output_hash: string;
  rounding_mode: string;
  day_count_convention: string;
  unrounded_total_interest: string;
  rounding_residual: string;
}
interface OfferInstallment {
  installment_number: number;
  due_date: string;
  principal_due: string;
  interest_due: string;
  fees_due: string;
  total_due: string;
  period_start: string;
  period_end: string;
  opening_principal: string;
  unrounded_interest: string;
  calculation_hash: string;
}

export function generateSchedule(input: {
  principal: string;
  annualRate: string;
  tenureDays: number;
  effectiveDate: string;
  frequency: Frequency;
  interestType: InterestType;
  dayCountConvention: string;
  roundingMode: RoundingMode;
  fees: FeeLine[];
}) {
  Decimal.set({ precision: 50, rounding: rounding(input.roundingMode) });
  const principal = new Decimal(input.principal);
  const dates = dueDates(
    input.effectiveDate,
    input.tenureDays,
    input.frequency,
  );
  const principalParts = splitMinor(BigInt(input.principal), dates.length);
  let opening = BigInt(input.principal);
  const unrounded: Decimal[] = [];
  let previous = input.effectiveDate;
  for (let i = 0; i < dates.length; i++) {
    const days = daysBetween(previous, dates[i]!);
    const basis =
      input.interestType === "FLAT"
        ? principal
        : new Decimal(opening.toString());
    unrounded.push(
      basis
        .mul(input.annualRate)
        .mul(days)
        .div(new Decimal(100).mul(denominator(input.dayCountConvention))),
    );
    opening -= principalParts[i]!;
    previous = dates[i]!;
  }
  const unroundedTotal = unrounded.reduce(
    (sum, value) => sum.add(value),
    new Decimal(0),
  );
  const target = BigInt(unroundedTotal.toDecimalPlaces(0).toFixed(0));
  const interests = unrounded.map((value) =>
    BigInt(value.toDecimalPlaces(0).toFixed(0)),
  );
  const initiallyRounded = interests.reduce((sum, value) => sum + value, 0n);
  const residual = target - initiallyRounded;
  interests[interests.length - 1] = interests[interests.length - 1]! + residual;
  const financedFees = input.fees
    .filter((fee) => fee.treatment === "FINANCED")
    .reduce((sum, fee) => sum + BigInt(fee.amountMinor), 0n);
  const feeParts = splitMinor(financedFees, dates.length);
  opening = BigInt(input.principal);
  previous = input.effectiveDate;
  const installments: Installment[] = dates.map((dueDate, index) => {
    const item = {
      number: index + 1,
      periodStart: previous,
      periodEnd: dueDate,
      dueDate,
      openingPrincipal: opening,
      principal: principalParts[index]!,
      interest: interests[index]!,
      fees: feeParts[index]!,
      unroundedInterest: unrounded[index]!.toFixed(12),
      calculationHash: "",
    };
    item.calculationHash = hash(wireInstallment(item));
    opening -= item.principal;
    previous = dueDate;
    return item;
  });
  return {
    maturityDate: dates[dates.length - 1]!,
    totalInterest: target,
    unroundedTotalInterest: unroundedTotal.toFixed(12),
    roundingResidual: residual,
    installments,
  };
}
function splitMinor(total: bigint, count: number): bigint[] {
  const base = total / BigInt(count);
  const remainder = total % BigInt(count);
  return Array.from(
    { length: count },
    (_, index) => base + (BigInt(index) < remainder ? 1n : 0n),
  );
}
function dueDates(
  start: string,
  tenureDays: number,
  frequency: Frequency,
): string[] {
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const maturity = addDays(startDate, tenureDays);
  if (frequency === "BULLET") return [isoDate(maturity)];
  const dates: string[] = [];
  let cursor = startDate;
  while (cursor < maturity) {
    cursor =
      frequency === "MONTHLY"
        ? addMonths(cursor, 1)
        : frequency === "QUARTERLY"
          ? addMonths(cursor, 3)
          : addDays(
              cursor,
              frequency === "DAILY" ? 1 : frequency === "WEEKLY" ? 7 : 14,
            );
    dates.push(isoDate(cursor > maturity ? maturity : cursor));
  }
  return dates;
}
function parseFees(value: unknown): FeeLine[] {
  if (!Array.isArray(value)) return [];
  return value.map((raw) => {
    const fee = raw as Record<string, unknown>;
    if (
      typeof fee.code !== "string" ||
      typeof fee.description !== "string" ||
      typeof fee.amount_minor !== "string" ||
      !/^(0|[1-9][0-9]*)$/.test(fee.amount_minor) ||
      !["FINANCED", "DEDUCTED_FROM_DISBURSEMENT"].includes(
        String(fee.treatment),
      )
    )
      throw new Error("Invalid immutable fee snapshot");
    return {
      code: fee.code,
      description: fee.description,
      amountMinor: fee.amount_minor,
      treatment: fee.treatment as FeeLine["treatment"],
    };
  });
}
function denominator(convention: string): number {
  return convention === "ACTUAL_360" || convention === "THIRTY_360" ? 360 : 365;
}
function rounding(mode: RoundingMode): Decimal.Rounding {
  return mode === "HALF_UP"
    ? Decimal.ROUND_HALF_UP
    : mode === "DOWN"
      ? Decimal.ROUND_DOWN
      : Decimal.ROUND_HALF_EVEN;
}
function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(`${b}T00:00:00.000Z`).getTime() -
      new Date(`${a}T00:00:00.000Z`).getTime()) /
      86_400_000,
  );
}
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  result.setUTCDate(
    Math.min(
      day,
      new Date(
        Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
      ).getUTCDate(),
    ),
  );
  return result;
}
function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function validateDate(value: string): void {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())
  )
    throw new Error("Invalid calendar date");
}
function wireInstallment(item: Installment) {
  return {
    number: item.number,
    periodStart: item.periodStart,
    periodEnd: item.periodEnd,
    dueDate: item.dueDate,
    openingPrincipal: item.openingPrincipal.toString(),
    principal: item.principal.toString(),
    interest: item.interest.toString(),
    fees: item.fees.toString(),
    unroundedInterest: item.unroundedInterest,
  };
}
function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

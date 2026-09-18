import { createHash, randomUUID } from "node:crypto";
import type { Knex } from "knex";
import { withTenantTransaction } from "../database/client.js";

type PublishedVersion = {
  id: string;
  loan_product_id: string;
  product_type: string;
  currency: string;
  min_amount: string;
  max_amount: string;
  min_tenure_days: number;
  max_tenure_days: number;
  interest_rate: string;
  auto_approval_enabled: boolean;
  activated_for_tenant: boolean;
  configuration_hash: string;
  product_configuration: unknown;
  rule_snapshot: unknown;
};
export interface UnderwritingEvidence {
  kycTier: string;
  kycStatus: string;
  kycVerificationReference: string;
  consentReference: string;
  evidenceObservedAt: string;
  evidenceExpiresAt: string;
  monthlyIncomeMinor: string;
  existingExposureMinor: string;
  activeLoanCount: number;
  riskDisposition: "CLEAR" | "REFER" | "BLOCK";
}
export interface LendingEligibilityGateway {
  getLendingEligibility(input: {
    tenantId: string;
    customerId: string;
    consentReference: string;
  }): Promise<Record<string, unknown>>;
}
type RuleOutcome = "PASS" | "FAIL" | "REFER";
interface RuleResult {
  code: string;
  version: string;
  outcome: RuleOutcome;
  reason: string;
  observedHash: string;
}
interface EvidenceCollectionResult {
  evidence: UnderwritingEvidence;
  status: "READY" | "ACTION_REQUIRED";
}

export class LoanApplicationService {
  constructor(
    private readonly db: Knex,
    private readonly eligibility?: LendingEligibilityGateway,
  ) {}
  async submit(input: {
    tenantId: string;
    customerId: string;
    productVersionId: string;
    amountMinor: string;
    tenureDays: number;
    purpose: string;
    consentReference: string;
    declaredMonthlyIncomeMinor: string;
    idempotencyKey: string;
    correlationId: string;
  }): Promise<{
    id: string;
    applicationNumber: string;
    submittedAt: string;
    status: "SUBMITTED";
    underwritingStatus: "PENDING_EVIDENCE" | "READY" | "ACTION_REQUIRED";
    replayed: boolean;
  }> {
    validateSubmission(input);
    const submitted = await withTenantTransaction(
      this.db,
      input.tenantId,
      async (tx) => {
        const requestHash = hash({
          customerId: input.customerId,
          productVersionId: input.productVersionId,
          amountMinor: input.amountMinor,
          tenureDays: input.tenureDays,
          purpose: input.purpose,
          consentReference: input.consentReference,
          declaredMonthlyIncomeMinor: input.declaredMonthlyIncomeMinor,
        });
        const existing = await tx("loan_applications")
          .where({
            tenant_id: input.tenantId,
            idempotency_key: input.idempotencyKey,
          })
          .first<{
            id: string;
            application_number: string;
            submitted_at: Date;
            request_hash: string;
            underwriting_status:
              "PENDING_EVIDENCE" | "READY" | "ACTION_REQUIRED";
          }>();
        if (existing) {
          if (existing.request_hash !== requestHash)
            throw new Error(
              "Idempotency key reused with different application",
            );
          return {
            id: existing.id,
            applicationNumber: existing.application_number,
            submittedAt: existing.submitted_at.toISOString(),
            status: "SUBMITTED" as const,
            underwritingStatus: existing.underwriting_status,
            replayed: true,
          };
        }
        const version = await tx("loan_product_versions")
          .where({
            tenant_id: input.tenantId,
            id: input.productVersionId,
            status: "PUBLISHED",
            is_current: true,
            activated_for_tenant: true,
            currency: "NGN",
          })
          .first<PublishedVersion>();
        if (!version)
          throw new Error("Published loan product version is unavailable");
        if (
          BigInt(input.amountMinor) < BigInt(version.min_amount) ||
          BigInt(input.amountMinor) > BigInt(version.max_amount) ||
          input.tenureDays < version.min_tenure_days ||
          input.tenureDays > version.max_tenure_days
        )
          throw new Error("Requested terms are outside product boundaries");
        const id = randomUUID();
        const applicationNumber = `APP-${id}`;
        const submittedAt = new Date();
        await tx("loan_applications").insert({
          id,
          tenant_id: input.tenantId,
          customer_id: input.customerId,
          loan_product_id: version.loan_product_id,
          loan_product_version_id: version.id,
          application_number: applicationNumber,
          requested_amount: input.amountMinor,
          requested_tenure_days: input.tenureDays,
          requested_interest_rate: version.interest_rate,
          currency: "NGN",
          status: "SUBMITTED",
          purpose: input.purpose,
          application_data: "{}",
          submitted_at: submittedAt,
          idempotency_key: input.idempotencyKey,
          request_hash: requestHash,
          correlation_id: input.correlationId,
          product_configuration_hash: version.configuration_hash,
          consent_reference: input.consentReference,
          declared_monthly_income_minor: input.declaredMonthlyIncomeMinor,
          declared_income_source: "CUSTOMER_DECLARED",
          income_verification_status: "UNVERIFIED",
          underwriting_status: "PENDING_EVIDENCE",
        });
        await tx("loan_outbox_events").insert({
          tenant_id: input.tenantId,
          aggregate_type: "loan_application",
          aggregate_id: id,
          event_type: "loan.application-submitted.v1",
          event_version: 1,
          idempotency_key: `application:${id}:submitted`,
          correlation_id: input.correlationId,
          payload: {
            application_id: id,
            customer_id: input.customerId,
            amount_minor: input.amountMinor,
            currency: "NGN",
          },
        });
        return {
          id,
          applicationNumber,
          submittedAt: submittedAt.toISOString(),
          status: "SUBMITTED" as const,
          underwritingStatus: "PENDING_EVIDENCE" as const,
          replayed: false,
        };
      },
    );
    if (
      !this.eligibility ||
      (submitted.replayed &&
        submitted.underwritingStatus !== "PENDING_EVIDENCE")
    )
      return submitted;
    try {
      const collection = await this.collectEvidence({
        tenantId: input.tenantId,
        applicationId: submitted.id,
        customerId: input.customerId,
        consentReference: input.consentReference,
        declaredMonthlyIncomeMinor: input.declaredMonthlyIncomeMinor,
      });
      return {
        ...submitted,
        underwritingStatus: collection.status,
      };
    } catch {
      return { ...submitted, underwritingStatus: "PENDING_EVIDENCE" as const };
    }
  }

  private async collectEvidence(input: {
    tenantId: string;
    applicationId: string;
    customerId: string;
    consentReference: string;
    declaredMonthlyIncomeMinor: string;
  }): Promise<EvidenceCollectionResult> {
    if (!this.eligibility) throw new Error("Eligibility gateway unavailable");
    const auth = await this.eligibility.getLendingEligibility(input);
    const kyc = object(auth, "kyc");
    const risk = object(auth, "risk");
    const consent = object(auth, "consent");
    const exposure = await withTenantTransaction(
      this.db,
      input.tenantId,
      async (tx) => {
        const rows = await tx("loans")
          .where({ tenant_id: input.tenantId, customer_id: input.customerId })
          .whereIn("status", ["APPROVED", "ACTIVE", "OVERDUE", "RESTRUCTURED"])
          .whereNull("deleted_at")
          .select<
            {
              active_loan_count: number;
              existing_exposure_minor: string;
              maximum_days_past_due: number;
            }[]
          >(
            tx.raw("count(*)::integer as active_loan_count"),
            tx.raw(
              "coalesce(sum(outstanding_principal + outstanding_interest + outstanding_fees + outstanding_penalties),0)::text as existing_exposure_minor",
            ),
            tx.raw(
              "coalesce(max(days_past_due),0)::integer as maximum_days_past_due",
            ),
          );
        const row = rows[0];
        return {
          activeLoanCount: Number(row?.active_loan_count ?? 0),
          existingExposureMinor: String(row?.existing_exposure_minor ?? "0"),
          maximumDaysPastDue: Number(row?.maximum_days_past_due ?? 0),
        };
      },
    );
    const now = new Date().toISOString();
    const evidence: UnderwritingEvidence = {
      kycTier: text(kyc, "tier"),
      kycStatus: text(kyc, "status"),
      kycVerificationReference: textOr(
        kyc,
        "verification_reference",
        "unavailable",
      ),
      consentReference: input.consentReference,
      evidenceObservedAt: textOr(kyc, "observed_at", now),
      evidenceExpiresAt: textOr(
        kyc,
        "expires_at",
        new Date(Date.now() + 86_400_000).toISOString(),
      ),
      monthlyIncomeMinor: input.declaredMonthlyIncomeMinor,
      existingExposureMinor: exposure.existingExposureMinor,
      activeLoanCount: exposure.activeLoanCount,
      riskDisposition: enumRisk(risk.disposition),
    };
    const consentValid = consent.valid === true;
    const collectionStatus = !consentValid
      ? "ACTION_REQUIRED"
      : evidence.riskDisposition === "REFER"
        ? "ACTION_REQUIRED"
        : "READY";
    await withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const snapshotId = randomUUID();
      const latestVersion = await tx("loan_underwriting_evidence_snapshots")
        .where({
          tenant_id: input.tenantId,
          application_id: input.applicationId,
        })
        .max<{ snapshot_version: number | string | null }>(
          "snapshot_version as snapshot_version",
        )
        .first();
      const snapshotVersion = Number(latestVersion?.snapshot_version ?? 0) + 1;
      const normalized = {
        ...evidence,
        maximumDaysPastDue: exposure.maximumDaysPastDue,
        consentValid,
      };
      await tx("loan_underwriting_evidence_snapshots").insert({
        id: snapshotId,
        tenant_id: input.tenantId,
        application_id: input.applicationId,
        snapshot_version: snapshotVersion,
        collection_status: collectionStatus,
        kyc_tier: evidence.kycTier,
        kyc_status: evidence.kycStatus,
        kyc_verification_reference: evidence.kycVerificationReference,
        risk_disposition: evidence.riskDisposition,
        risk_reason_codes: JSON.stringify(
          Array.isArray(risk.reason_codes) ? risk.reason_codes : [],
        ),
        consent_reference: input.consentReference,
        consent_valid: consentValid,
        declared_monthly_income_minor: input.declaredMonthlyIncomeMinor,
        income_source: "CUSTOMER_DECLARED",
        income_verification_status: "UNVERIFIED",
        existing_exposure_minor: exposure.existingExposureMinor,
        active_loan_count: exposure.activeLoanCount,
        maximum_days_past_due: exposure.maximumDaysPastDue,
        observed_at: evidence.evidenceObservedAt,
        expires_at: evidence.evidenceExpiresAt,
        snapshot_hash: hash(normalized),
        collected_at: tx.fn.now(),
      });
      for (const source of [
        {
          type: "KYC",
          service: "parc-auth-customer",
          ref: evidence.kycVerificationReference,
          payload: kyc,
        },
        {
          type: "IDENTITY_RISK",
          service: "parc-auth-customer",
          ref: textOr(risk, "assessment_reference", "unavailable"),
          payload: risk,
        },
        {
          type: "CONSENT",
          service: "parc-auth-customer",
          ref: input.consentReference,
          payload: consent,
        },
        {
          type: "INCOME",
          service: "customer-declaration",
          ref: input.applicationId,
          payload: {
            amount_minor: input.declaredMonthlyIncomeMinor,
            verification_status: "UNVERIFIED",
          },
        },
        {
          type: "LENDING_EXPOSURE",
          service: "parc-lending",
          ref: input.customerId,
          payload: exposure,
        },
      ])
        await tx("loan_underwriting_evidence_sources").insert({
          tenant_id: input.tenantId,
          snapshot_id: snapshotId,
          application_id: input.applicationId,
          evidence_type: source.type,
          source_service: source.service,
          source_reference: source.ref,
          source_version: "v1",
          outcome:
            source.type === "CONSENT" && !consentValid
              ? "BLOCKED"
              : "AVAILABLE",
          normalized_payload: JSON.stringify(source.payload),
          payload_hash: hash(source.payload),
          observed_at: evidence.evidenceObservedAt,
          expires_at: evidence.evidenceExpiresAt,
        });
      await tx("loan_applications")
        .where({ tenant_id: input.tenantId, id: input.applicationId })
        .update({
          latest_underwriting_snapshot_id: snapshotId,
          underwriting_status:
            collectionStatus === "READY" ? "READY" : "ACTION_REQUIRED",
          kyc_tier: evidence.kycTier,
          kyc_status: evidence.kycStatus,
          kyc_verification_reference: evidence.kycVerificationReference,
          affordability_input_hash: hash({
            income: evidence.monthlyIncomeMinor,
            ...exposure,
          }),
          evidence_observed_at: evidence.evidenceObservedAt,
          evidence_expires_at: evidence.evidenceExpiresAt,
        });
    });
    return {
      evidence,
      status: collectionStatus,
    };
  }
  async evaluate(input: {
    tenantId: string;
    applicationId: string;
    evidence: UnderwritingEvidence;
    idempotencyKey: string;
  }): Promise<{
    evaluationId: string;
    decision: "APPROVED" | "REJECTED" | "REFER";
    replayed: boolean;
  }> {
    const inputHash = hash(input.evidence);
    return withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const existing = await tx("loan_automated_evaluations")
        .where({
          tenant_id: input.tenantId,
          idempotency_key: input.idempotencyKey,
        })
        .first<{
          id: string;
          input_hash: string;
          outcome: "APPROVED" | "REJECTED" | "REFER";
          status: string;
        }>();
      if (existing) {
        if (existing.input_hash !== inputHash)
          throw new Error(
            "Idempotency key reused with different underwriting evidence",
          );
        if (existing.status !== "COMPLETED")
          throw new Error("Evaluation is still processing");
        return {
          evaluationId: existing.id,
          decision: existing.outcome,
          replayed: true,
        };
      }
      const application = await tx("loan_applications as a")
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
          "a.status": "SUBMITTED",
        })
        .forUpdate()
        .first<
          PublishedVersion & {
            application_id: string;
            requested_amount: string;
            requested_tenure_days: number;
          }
        >(
          "v.*",
          "a.id as application_id",
          "a.requested_amount",
          "a.requested_tenure_days",
        );
      if (!application) throw new Error("Submitted application not found");
      if (new Date(input.evidence.evidenceExpiresAt).getTime() <= Date.now())
        throw new Error("Underwriting evidence is expired");
      await tx("loan_applications")
        .where({ tenant_id: input.tenantId, id: input.applicationId })
        .update({ status: "ELIGIBILITY_CHECK" });
      const policy = parsePolicy(application.product_configuration);
      const evaluationId = randomUUID();
      const rules = evaluateRules(application, input.evidence, policy);
      const decision = rules.some((r) => r.outcome === "FAIL")
        ? "REJECTED"
        : rules.some((r) => r.outcome === "REFER") ||
            !application.auto_approval_enabled ||
            !["UNSECURED_PERSONAL", "INSTANT"].includes(
              application.product_type,
            )
          ? "REFER"
          : "APPROVED";
      const reasonCodes = rules
        .filter((r) => r.outcome !== "PASS")
        .map((r) => r.reason);
      await tx("loan_automated_evaluations").insert({
        id: evaluationId,
        tenant_id: input.tenantId,
        application_id: input.applicationId,
        policy_version: policy?.version ?? "MISSING",
        model_version: policy?.modelVersion,
        product_configuration_hash: application.configuration_hash,
        input_hash: inputHash,
        rule_snapshot_hash: hash(application.rule_snapshot),
        status: "COMPLETED",
        outcome: decision,
        reason_codes: JSON.stringify(reasonCodes),
        idempotency_key: input.idempotencyKey,
        started_at: tx.fn.now(),
        completed_at: tx.fn.now(),
      });
      await tx("loan_automated_rule_results").insert(
        rules.map((r) => ({
          tenant_id: input.tenantId,
          evaluation_id: evaluationId,
          application_id: input.applicationId,
          rule_code: r.code,
          rule_version: r.version,
          outcome: r.outcome,
          reason_code: r.reason,
          observed_value_hash: r.observedHash,
        })),
      );
      await tx("loan_application_decisions").insert({
        tenant_id: input.tenantId,
        application_id: input.applicationId,
        decision,
        approved_amount:
          decision === "APPROVED" ? application.requested_amount : null,
        approved_tenure_days:
          decision === "APPROVED" ? application.requested_tenure_days : null,
        approved_interest_rate:
          decision === "APPROVED" ? application.interest_rate : null,
        decision_reason: reasonCodes.join(",") || "AUTOMATED_POLICY_PASS",
        decision_data: "{}",
        decision_source: "AUTOMATED",
        policy_version: policy?.version ?? "MISSING",
        model_version: policy?.modelVersion,
        reason_codes: JSON.stringify(reasonCodes),
        evaluation_id: evaluationId,
        request_hash: hash({ evaluationId, decision, reasonCodes }),
      });
      const status =
        decision === "APPROVED"
          ? "APPROVED"
          : decision === "REJECTED"
            ? "REJECTED"
            : "UNDER_REVIEW";
      await tx("loan_applications")
        .where({ tenant_id: input.tenantId, id: input.applicationId })
        .update({
          status,
          approved_amount:
            decision === "APPROVED" ? application.requested_amount : null,
          approved_tenure_days:
            decision === "APPROVED" ? application.requested_tenure_days : null,
          approved_interest_rate:
            decision === "APPROVED" ? application.interest_rate : null,
          approved_at: decision === "APPROVED" ? tx.fn.now() : null,
          rejected_at: decision === "REJECTED" ? tx.fn.now() : null,
          rejection_reason:
            decision === "REJECTED" ? reasonCodes.join(",") : null,
        });
      await tx("loan_outbox_events").insert({
        tenant_id: input.tenantId,
        aggregate_type: "loan_application",
        aggregate_id: input.applicationId,
        event_type: "loan.automated-decision-completed.v1",
        event_version: 1,
        idempotency_key: `evaluation:${evaluationId}:completed`,
        payload: {
          application_id: input.applicationId,
          evaluation_id: evaluationId,
          decision,
          reason_codes: reasonCodes,
        },
      });
      return { evaluationId, decision, replayed: false };
    });
  }
}
interface Policy {
  version: string;
  modelVersion?: string;
  minimumKycTier: string;
  maxActiveLoans: number;
  maxTotalExposureToMonthlyIncomeRate: string;
}
function parsePolicy(value: unknown): Policy | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = (value as { underwriting?: unknown }).underwriting;
  if (typeof candidate !== "object" || candidate === null) return null;
  const p = candidate as Partial<Policy>;
  if (
    typeof p.version !== "string" ||
    typeof p.minimumKycTier !== "string" ||
    typeof p.maxActiveLoans !== "number" ||
    typeof p.maxTotalExposureToMonthlyIncomeRate !== "string"
  )
    return null;
  return {
    version: p.version,
    minimumKycTier: p.minimumKycTier,
    maxActiveLoans: p.maxActiveLoans,
    maxTotalExposureToMonthlyIncomeRate: p.maxTotalExposureToMonthlyIncomeRate,
    ...(p.modelVersion ? { modelVersion: p.modelVersion } : {}),
  };
}
function evaluateRules(
  application: { requested_amount: string },
  e: UnderwritingEvidence,
  p: Policy | null,
): RuleResult[] {
  if (!p)
    return [
      {
        code: "POLICY_PRESENT",
        version: "1",
        outcome: "REFER",
        reason: "UNDERWRITING_POLICY_MISSING",
        observedHash: hash(null),
      },
    ];
  const results: RuleResult[] = [];
  results.push(
    rule(
      "KYC",
      p.version,
      e.kycStatus === "VERIFIED" && tier(e.kycTier) >= tier(p.minimumKycTier),
      "KYC_REQUIREMENT_NOT_MET",
      { tier: e.kycTier, status: e.kycStatus },
    ),
  );
  results.push({
    code: "IDENTITY_RISK",
    version: p.version,
    outcome:
      e.riskDisposition === "CLEAR"
        ? "PASS"
        : e.riskDisposition === "BLOCK"
          ? "FAIL"
          : "REFER",
    reason:
      e.riskDisposition === "CLEAR"
        ? "IDENTITY_RISK_PASSED"
        : e.riskDisposition === "BLOCK"
          ? "IDENTITY_RISK_BLOCKED"
          : "IDENTITY_RISK_REVIEW_REQUIRED",
    observedHash: hash(e.riskDisposition),
  });
  results.push(
    rule(
      "ACTIVE_LOANS",
      p.version,
      e.activeLoanCount <= p.maxActiveLoans,
      "ACTIVE_LOAN_LIMIT_EXCEEDED",
      e.activeLoanCount,
    ),
  );
  const ratio = parseRate(p.maxTotalExposureToMonthlyIncomeRate);
  const exposure =
    BigInt(e.existingExposureMinor) + BigInt(application.requested_amount);
  results.push(
    rule(
      "AFFORDABILITY",
      p.version,
      exposure * 10_000_000_000n <= BigInt(e.monthlyIncomeMinor) * ratio,
      "AFFORDABILITY_LIMIT_EXCEEDED",
      { exposure: exposure.toString(), income: e.monthlyIncomeMinor },
    ),
  );
  return results;
}
function rule(
  code: string,
  version: string,
  pass: boolean,
  reason: string,
  observed: unknown,
): RuleResult {
  return {
    code,
    version,
    outcome: pass ? "PASS" : "FAIL",
    reason: pass ? `${code}_PASSED` : reason,
    observedHash: hash(observed),
  };
}
function tier(value: string): number {
  return (
    ({ TIER_1: 1, TIER_2: 2, TIER_3: 3 } as Record<string, number>)[value] ?? 0
  );
}
function parseRate(value: string): bigint {
  if (!/^(0|[1-9]\d*)(\.\d{1,10})?$/.test(value))
    throw new Error("Invalid policy rate");
  const [whole = "0", fraction = ""] = value.split(".");
  return BigInt(whole) * 10_000_000_000n + BigInt(fraction.padEnd(10, "0"));
}
function validateSubmission(input: {
  amountMinor: string;
  tenureDays: number;
  purpose: string;
  declaredMonthlyIncomeMinor: string;
}): void {
  if (
    !/^[1-9]\d*$/.test(input.amountMinor) ||
    !Number.isInteger(input.tenureDays) ||
    input.tenureDays < 1
  )
    throw new Error("Invalid requested terms");
  for (const value of [input.declaredMonthlyIncomeMinor])
    if (!/^\d+$/.test(value))
      throw new Error("Affordability values must be minor-unit strings");
  if (input.purpose.trim().length < 2) throw new Error("Purpose is required");
}
function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
function object(
  value: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const result = value[key];
  if (!result || typeof result !== "object" || Array.isArray(result))
    throw new Error(`Eligibility response is missing ${key}`);
  return result as Record<string, unknown>;
}
function text(value: Record<string, unknown>, key: string): string {
  const result = value[key];
  if (typeof result !== "string")
    throw new Error(`Eligibility response is missing ${key}`);
  return result;
}
function textOr(
  value: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  return typeof value[key] === "string" ? String(value[key]) : fallback;
}
function enumRisk(value: unknown): "CLEAR" | "REFER" | "BLOCK" {
  if (value === "CLEAR" || value === "REFER" || value === "BLOCK") return value;
  return "REFER";
}

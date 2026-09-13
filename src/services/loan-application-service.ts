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
  fraudFlag: boolean;
}
type RuleOutcome = "PASS" | "FAIL" | "REFER";
interface RuleResult {
  code: string;
  version: string;
  outcome: RuleOutcome;
  reason: string;
  observedHash: string;
}

export class LoanApplicationService {
  constructor(private readonly db: Knex) {}
  async submit(input: {
    tenantId: string;
    customerId: string;
    productVersionId: string;
    amountMinor: string;
    tenureDays: number;
    purpose: string;
    evidence: UnderwritingEvidence;
    idempotencyKey: string;
    correlationId: string;
  }): Promise<{ id: string; status: "SUBMITTED"; replayed: boolean }> {
    validateSubmission(input);
    return withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const requestHash = hash({
        customerId: input.customerId,
        productVersionId: input.productVersionId,
        amountMinor: input.amountMinor,
        tenureDays: input.tenureDays,
        purpose: input.purpose,
        evidence: input.evidence,
      });
      const existing = await tx("loan_applications")
        .where({
          tenant_id: input.tenantId,
          idempotency_key: input.idempotencyKey,
        })
        .first<{ id: string; request_hash: string; status: string }>();
      if (existing) {
        if (existing.request_hash !== requestHash)
          throw new Error("Idempotency key reused with different application");
        return { id: existing.id, status: "SUBMITTED", replayed: true };
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
      await tx("loan_applications").insert({
        id,
        tenant_id: input.tenantId,
        customer_id: input.customerId,
        loan_product_id: version.loan_product_id,
        loan_product_version_id: version.id,
        application_number: `APP-${id}`,
        requested_amount: input.amountMinor,
        requested_tenure_days: input.tenureDays,
        requested_interest_rate: version.interest_rate,
        currency: "NGN",
        status: "SUBMITTED",
        purpose: input.purpose,
        application_data: "{}",
        submitted_at: tx.fn.now(),
        idempotency_key: input.idempotencyKey,
        request_hash: requestHash,
        correlation_id: input.correlationId,
        product_configuration_hash: version.configuration_hash,
        kyc_tier: input.evidence.kycTier,
        kyc_status: input.evidence.kycStatus,
        kyc_verification_reference: input.evidence.kycVerificationReference,
        affordability_input_hash: hash({
          monthlyIncomeMinor: input.evidence.monthlyIncomeMinor,
          existingExposureMinor: input.evidence.existingExposureMinor,
          activeLoanCount: input.evidence.activeLoanCount,
        }),
        consent_reference: input.evidence.consentReference,
        evidence_observed_at: input.evidence.evidenceObservedAt,
        evidence_expires_at: input.evidence.evidenceExpiresAt,
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
      return { id, status: "SUBMITTED", replayed: false };
    });
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
  results.push(
    rule(
      "FRAUD",
      p.version,
      !e.fraudFlag,
      "FRAUD_REVIEW_REQUIRED",
      e.fraudFlag,
    ),
  );
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
  evidence: UnderwritingEvidence;
}): void {
  if (
    !/^[1-9]\d*$/.test(input.amountMinor) ||
    !Number.isInteger(input.tenureDays) ||
    input.tenureDays < 1
  )
    throw new Error("Invalid requested terms");
  for (const value of [
    input.evidence.monthlyIncomeMinor,
    input.evidence.existingExposureMinor,
  ])
    if (!/^\d+$/.test(value))
      throw new Error("Affordability values must be minor-unit strings");
  if (input.purpose.trim().length < 2) throw new Error("Purpose is required");
}
function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

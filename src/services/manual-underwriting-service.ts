import { createHash, randomUUID } from "node:crypto";
import type { Knex } from "knex";
import { withTenantTransaction } from "../database/client.js";
import type { LendingApprovalGateway } from "./approval-gateway.js";

type Recommendation = "APPROVED" | "REJECTED" | "CONDITIONAL_APPROVAL";
type ProposedTerms = {
  amountMinor: string;
  tenureDays: number;
  interestRate: string;
};

export class ManualUnderwritingService {
  constructor(
    private readonly db: Knex,
    private readonly approvals: LendingApprovalGateway,
  ) {}

  async open(input: {
    tenantId: string;
    applicationId: string;
    requiredAuthorityLevel: number;
    reasonCodes: string[];
    idempotencyKey: string;
  }) {
    if (
      !Number.isInteger(input.requiredAuthorityLevel) ||
      input.requiredAuthorityLevel < 1 ||
      input.reasonCodes.length === 0
    )
      throw new Error("Manual review requires authority and reason codes");
    const requestHash = hash({
      applicationId: input.applicationId,
      requiredAuthorityLevel: input.requiredAuthorityLevel,
      reasonCodes: input.reasonCodes,
    });
    return withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const replay = await tx("loan_manual_review_cases")
        .where({
          tenant_id: input.tenantId,
          opening_idempotency_key: input.idempotencyKey,
        })
        .first<{ id: string; opening_request_hash: string }>();
      if (replay) {
        if (replay.opening_request_hash !== requestHash)
          throw new Error(
            "Idempotency key reused with different manual review",
          );
        return { id: replay.id, replayed: true };
      }
      const application = await tx("loan_applications")
        .where({
          tenant_id: input.tenantId,
          id: input.applicationId,
          status: "UNDER_REVIEW",
        })
        .forUpdate()
        .first<{ id: string }>("id");
      if (!application)
        throw new Error("Application is not awaiting manual review");
      const existing = await tx("loan_manual_review_cases")
        .where({
          tenant_id: input.tenantId,
          application_id: input.applicationId,
        })
        .whereIn("status", ["OPEN", "ASSIGNED", "PENDING_APPROVAL"])
        .first<{ id: string }>("id");
      if (existing) throw new Error("An active manual review already exists");
      const id = randomUUID();
      await tx("loan_manual_review_cases").insert({
        id,
        tenant_id: input.tenantId,
        application_id: input.applicationId,
        required_authority_level: input.requiredAuthorityLevel,
        opened_reason_codes: JSON.stringify(input.reasonCodes),
        opening_idempotency_key: input.idempotencyKey,
        opening_request_hash: requestHash,
      });
      return { id, replayed: false };
    });
  }

  async assign(input: {
    tenantId: string;
    reviewCaseId: string;
    reviewerId: string;
    expectedLockVersion: number;
    leaseUntil: string;
    idempotencyKey: string;
  }) {
    if (new Date(input.leaseUntil).getTime() <= Date.now())
      throw new Error("Review lease must be in the future");
    const requestHash = hash({
      reviewCaseId: input.reviewCaseId,
      reviewerId: input.reviewerId,
      expectedLockVersion: input.expectedLockVersion,
      leaseUntil: input.leaseUntil,
    });
    return withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const replay = await tx("loan_manual_review_assignments")
        .where({
          tenant_id: input.tenantId,
          idempotency_key: input.idempotencyKey,
        })
        .first<{
          request_hash: string;
          resulting_lock_version: number;
        }>();
      if (replay) {
        if (replay.request_hash !== requestHash)
          throw new Error(
            "Idempotency key reused with different manual assignment",
          );
        return { lockVersion: replay.resulting_lock_version, replayed: true };
      }
      const updated = await tx("loan_manual_review_cases")
        .where({
          tenant_id: input.tenantId,
          id: input.reviewCaseId,
          lock_version: input.expectedLockVersion,
        })
        .whereIn("status", ["OPEN", "ASSIGNED"])
        .update({
          status: "ASSIGNED",
          assigned_reviewer_id: input.reviewerId,
          assigned_at: tx.fn.now(),
          lease_expires_at: input.leaseUntil,
          lock_version: input.expectedLockVersion + 1,
        });
      if (updated !== 1) throw new Error("Manual review assignment conflict");
      const lockVersion = input.expectedLockVersion + 1;
      await tx("loan_manual_review_assignments").insert({
        tenant_id: input.tenantId,
        review_case_id: input.reviewCaseId,
        reviewer_id: input.reviewerId,
        expected_lock_version: input.expectedLockVersion,
        resulting_lock_version: lockVersion,
        lease_expires_at: input.leaseUntil,
        idempotency_key: input.idempotencyKey,
        request_hash: requestHash,
      });
      return { lockVersion, replayed: false };
    });
  }

  async recommend(input: {
    tenantId: string;
    reviewCaseId: string;
    reviewerId: string;
    recommendation: Recommendation;
    proposedTerms?: ProposedTerms;
    reasonCodes: string[];
    evidenceReferences: string[];
    comments?: string;
    policyVersion: string;
    conditions?: { code: string; description: string }[];
    idempotencyKey: string;
  }) {
    validateRecommendation(input);
    const requestHash = hash({
      reviewCaseId: input.reviewCaseId,
      reviewerId: input.reviewerId,
      recommendation: input.recommendation,
      proposedTerms: input.proposedTerms,
      reasonCodes: input.reasonCodes,
      evidenceReferences: input.evidenceReferences,
      comments: input.comments,
      policyVersion: input.policyVersion,
      conditions: input.conditions,
    });
    return withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const existing = await tx("loan_manual_review_recommendations")
        .where({
          tenant_id: input.tenantId,
          idempotency_key: input.idempotencyKey,
        })
        .first<{ id: string; request_hash: string }>();
      if (existing) {
        if (existing.request_hash !== requestHash)
          throw new Error(
            "Idempotency key reused with different recommendation",
          );
        return { id: existing.id, payloadHash: requestHash, replayed: true };
      }
      const review = await tx("loan_manual_review_cases")
        .where({
          tenant_id: input.tenantId,
          id: input.reviewCaseId,
          status: "ASSIGNED",
          assigned_reviewer_id: input.reviewerId,
        })
        .where("lease_expires_at", ">", tx.fn.now())
        .forUpdate()
        .first<{ application_id: string }>();
      if (!review) throw new Error("Active reviewer assignment not found");
      const id = randomUUID();
      await tx("loan_manual_review_recommendations").insert({
        id,
        tenant_id: input.tenantId,
        review_case_id: input.reviewCaseId,
        application_id: review.application_id,
        reviewer_id: input.reviewerId,
        recommendation: input.recommendation,
        proposed_amount: input.proposedTerms?.amountMinor ?? null,
        proposed_tenure_days: input.proposedTerms?.tenureDays ?? null,
        proposed_interest_rate: input.proposedTerms?.interestRate ?? null,
        reason_codes: JSON.stringify(input.reasonCodes),
        evidence_references: JSON.stringify(input.evidenceReferences),
        comments: input.comments ?? null,
        policy_version: input.policyVersion,
        request_hash: requestHash,
        idempotency_key: input.idempotencyKey,
      });
      if (input.conditions?.length)
        await tx("loan_manual_decision_conditions").insert(
          input.conditions.map((condition) => ({
            tenant_id: input.tenantId,
            recommendation_id: id,
            condition_code: condition.code,
            description: condition.description,
          })),
        );
      await tx("loan_manual_review_cases")
        .where({ tenant_id: input.tenantId, id: input.reviewCaseId })
        .update({
          status: "PENDING_APPROVAL",
          lock_version: tx.raw("lock_version + 1"),
        });
      return { id, payloadHash: requestHash, replayed: false };
    });
  }

  async decide(input: {
    tenantId: string;
    reviewCaseId: string;
    recommendationId: string;
    approvalId: string;
    executorId: string;
    idempotencyKey: string;
    correlationId: string;
  }) {
    return withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const replay = await tx("loan_application_decisions")
        .where({
          tenant_id: input.tenantId,
          idempotency_key: input.idempotencyKey,
        })
        .first<{
          id: string;
          request_hash: string;
          decision: Recommendation;
        }>();
      const recommendation = await tx("loan_manual_review_recommendations as r")
        .join("loan_manual_review_cases as c", function () {
          this.on("c.id", "=", "r.review_case_id").andOn(
            "c.tenant_id",
            "=",
            "r.tenant_id",
          );
        })
        .where({
          "r.tenant_id": input.tenantId,
          "r.id": input.recommendationId,
          "r.review_case_id": input.reviewCaseId,
        })
        .forUpdate()
        .first<{
          application_id: string;
          reviewer_id: string;
          recommendation: Recommendation;
          proposed_amount: string | null;
          proposed_tenure_days: number | null;
          proposed_interest_rate: string | null;
          reason_codes: string[];
          policy_version: string;
          request_hash: string;
          required_authority_level: number;
          review_status: string;
        }>("r.*", "c.required_authority_level", "c.status as review_status");
      if (!recommendation)
        throw new Error("Pending manual recommendation not found");
      const decisionHash = hash({
        reviewCaseId: input.reviewCaseId,
        recommendationId: input.recommendationId,
        decision: recommendation.recommendation,
        amountMinor: recommendation.proposed_amount,
        tenureDays: recommendation.proposed_tenure_days,
        interestRate: recommendation.proposed_interest_rate,
        currency: "NGN",
        recommendationHash: recommendation.request_hash,
      });
      if (replay) {
        if (replay.request_hash !== decisionHash)
          throw new Error(
            "Idempotency key reused with different manual decision",
          );
        return { id: replay.id, decision: replay.decision, replayed: true };
      }
      if (recommendation.review_status !== "PENDING_APPROVAL")
        throw new Error("Manual recommendation is not pending approval");
      const approval = await this.approvals.consume({
        tenantId: input.tenantId,
        approvalId: input.approvalId,
        action: "MANUAL_LOAN_APPROVAL",
        resourceType: "loan_manual_review_case",
        resourceId: input.reviewCaseId,
        payloadHash: decisionHash,
        idempotencyKey: input.idempotencyKey,
        correlationId: input.correlationId,
      });
      if (
        !approval.makerId ||
        !approval.checkerIds?.length ||
        !approval.authorityLevel ||
        !approval.consumedAt
      )
        throw new Error("Approval response lacks verified decision evidence");
      const id = randomUUID();
      await tx("loan_application_decisions").insert({
        id,
        tenant_id: input.tenantId,
        application_id: recommendation.application_id,
        decision: recommendation.recommendation,
        approved_amount:
          recommendation.recommendation === "REJECTED"
            ? null
            : recommendation.proposed_amount,
        approved_tenure_days:
          recommendation.recommendation === "REJECTED"
            ? null
            : recommendation.proposed_tenure_days,
        approved_interest_rate:
          recommendation.recommendation === "REJECTED"
            ? null
            : recommendation.proposed_interest_rate,
        decision_reason: recommendation.reason_codes.join(","),
        decision_data: "{}",
        decided_by: input.executorId,
        decision_source: "MANUAL",
        policy_version: recommendation.policy_version,
        reason_codes: JSON.stringify(recommendation.reason_codes),
        request_hash: decisionHash,
        approval_id: approval.approvalId,
        review_case_id: input.reviewCaseId,
        recommendation_id: input.recommendationId,
        approval_action: "MANUAL_LOAN_APPROVAL",
        approval_resource_type: "loan_manual_review_case",
        approval_resource_id: input.reviewCaseId,
        approval_payload_hash: decisionHash,
        approval_consumed_at: approval.consumedAt,
        approval_maker_id: approval.makerId,
        approval_checker_ids: JSON.stringify(approval.checkerIds),
        required_authority_level: recommendation.required_authority_level,
        approved_authority_level: approval.authorityLevel,
        idempotency_key: input.idempotencyKey,
        correlation_id: input.correlationId,
      });
      const final = recommendation.recommendation !== "CONDITIONAL_APPROVAL";
      if (final)
        await tx("loan_applications")
          .where({
            tenant_id: input.tenantId,
            id: recommendation.application_id,
          })
          .update({
            status: recommendation.recommendation,
            approved_amount:
              recommendation.recommendation === "APPROVED"
                ? recommendation.proposed_amount
                : null,
            approved_tenure_days:
              recommendation.recommendation === "APPROVED"
                ? recommendation.proposed_tenure_days
                : null,
            approved_interest_rate:
              recommendation.recommendation === "APPROVED"
                ? recommendation.proposed_interest_rate
                : null,
            approved_at:
              recommendation.recommendation === "APPROVED" ? tx.fn.now() : null,
            rejected_at:
              recommendation.recommendation === "REJECTED" ? tx.fn.now() : null,
            rejection_reason:
              recommendation.recommendation === "REJECTED"
                ? recommendation.reason_codes.join(",")
                : null,
          });
      await tx("loan_manual_review_cases")
        .where({ tenant_id: input.tenantId, id: input.reviewCaseId })
        .update({
          status: final ? "DECIDED" : "PENDING_APPROVAL",
          decided_at: final ? tx.fn.now() : null,
          lock_version: tx.raw("lock_version + 1"),
        });
      await tx("loan_outbox_events").insert({
        tenant_id: input.tenantId,
        aggregate_type: "loan_application",
        aggregate_id: recommendation.application_id,
        event_type: "loan.manual-decision-recorded.v1",
        event_version: 1,
        idempotency_key: `manual-decision:${id}`,
        correlation_id: input.correlationId,
        payload: {
          application_id: recommendation.application_id,
          review_case_id: input.reviewCaseId,
          decision_id: id,
          decision: recommendation.recommendation,
          reason_codes: recommendation.reason_codes,
          approval_id: approval.approvalId,
        },
      });
      return { id, decision: recommendation.recommendation, replayed: false };
    });
  }
}

function validateRecommendation(input: {
  recommendation: Recommendation;
  proposedTerms?: ProposedTerms;
  reasonCodes: string[];
  conditions?: { code: string; description: string }[];
}) {
  if (input.reasonCodes.length === 0)
    throw new Error("Reason codes are required");
  if (
    input.recommendation !== "REJECTED" &&
    (!input.proposedTerms ||
      !/^[0-9]+$/.test(input.proposedTerms.amountMinor) ||
      BigInt(input.proposedTerms.amountMinor) <= 0n ||
      input.proposedTerms.tenureDays < 1 ||
      !/^\d+(\.\d{1,10})?$/.test(input.proposedTerms.interestRate))
  )
    throw new Error("Valid proposed terms are required");
  if (
    input.recommendation === "CONDITIONAL_APPROVAL" &&
    !input.conditions?.length
  )
    throw new Error("Conditional approval requires conditions");
}
function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

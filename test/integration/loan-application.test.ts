import { randomUUID } from "node:crypto";
import knex, { type Knex } from "knex";
import {
  LoanApplicationService,
  type UnderwritingEvidence,
} from "../../src/services/loan-application-service.js";
import {
  LoanProductService,
  type LoanProductType,
  type VersionTerms,
} from "../../src/services/loan-product-service.js";
import { ManualUnderwritingService } from "../../src/services/manual-underwriting-service.js";
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
describeDatabase("LN-02 automated underwriting", () => {
  let db: Knex;
  const tenantId = randomUUID();
  const customerId = randomUUID();
  beforeAll(() => {
    db = knex({ client: "pg", connection: databaseUrl! });
  });
  afterAll(async () => {
    for (const [table, trigger] of [
      ["loan_application_decisions", "trg_protect_decision"],
      ["loan_automated_rule_results", "trg_protect_rule_result"],
      ["loan_automated_evaluations", "trg_protect_completed_evaluation"],
      ["loan_application_events", "trg_protect_application_events"],
    ] as const) {
      await db.raw(`ALTER TABLE public.${table} DISABLE TRIGGER ${trigger}`);
    }
    await db("loan_application_decisions")
      .where({ tenant_id: tenantId })
      .delete();
    await db.raw(
      "ALTER TABLE public.loan_manual_review_cases DISABLE TRIGGER trg_protect_decided_manual_case",
    );
    await db.raw(
      "ALTER TABLE public.loan_manual_review_recommendations DISABLE TRIGGER trg_protect_manual_recommendation",
    );
    await db.raw(
      "ALTER TABLE public.loan_manual_review_assignments DISABLE TRIGGER trg_protect_manual_assignment",
    );
    await db("loan_manual_decision_conditions")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_manual_review_recommendations")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_manual_review_assignments")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_manual_review_cases")
      .where({ tenant_id: tenantId })
      .delete();
    await db.raw(
      "ALTER TABLE public.loan_manual_review_recommendations ENABLE TRIGGER trg_protect_manual_recommendation",
    );
    await db.raw(
      "ALTER TABLE public.loan_manual_review_assignments ENABLE TRIGGER trg_protect_manual_assignment",
    );
    await db.raw(
      "ALTER TABLE public.loan_manual_review_cases ENABLE TRIGGER trg_protect_decided_manual_case",
    );
    await db("loan_automated_rule_results")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_automated_evaluations")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_application_events").where({ tenant_id: tenantId }).delete();
    for (const [table, trigger] of [
      ["loan_application_decisions", "trg_protect_decision"],
      ["loan_automated_rule_results", "trg_protect_rule_result"],
      ["loan_automated_evaluations", "trg_protect_completed_evaluation"],
      ["loan_application_events", "trg_protect_application_events"],
    ] as const) {
      await db.raw(`ALTER TABLE public.${table} ENABLE TRIGGER ${trigger}`);
    }
    await db("loan_outbox_events").where({ tenant_id: tenantId }).delete();
    await db("loan_applications").where({ tenant_id: tenantId }).delete();
    await db.raw(
      "ALTER TABLE public.loan_product_version_history DISABLE TRIGGER trg_protect_product_version_history",
    );
    await db("loan_product_version_history")
      .where({ tenant_id: tenantId })
      .delete();
    await db.raw(
      "ALTER TABLE public.loan_product_version_history ENABLE TRIGGER trg_protect_product_version_history",
    );
    await db.raw(
      "ALTER TABLE public.loan_product_versions DISABLE TRIGGER trg_protect_published_product_version",
    );
    await db("loan_product_versions").where({ tenant_id: tenantId }).delete();
    await db.raw(
      "ALTER TABLE public.loan_product_versions ENABLE TRIGGER trg_protect_published_product_version",
    );
    await db("loan_products").where({ tenant_id: tenantId }).delete();
    await db.destroy();
  });
  const evidence: UnderwritingEvidence = {
    kycTier: "TIER_2",
    kycStatus: "VERIFIED",
    kycVerificationReference: "kyc-ref",
    consentReference: "consent-ref",
    evidenceObservedAt: new Date().toISOString(),
    evidenceExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    monthlyIncomeMinor: "10000000",
    existingExposureMinor: "0",
    activeLoanCount: 0,
    riskDisposition: "CLEAR",
  };
  async function published(type: LoanProductType, code: string) {
    const products = new LoanProductService(db, {
      consume: () =>
        Promise.resolve({ approvalId: randomUUID(), replayed: false }),
    });
    const product = await products.createProduct({
      tenantId,
      code,
      name: code,
      type,
      idempotencyKey: `product-${code}`,
    });
    const terms: VersionTerms = {
      currency: "NGN",
      minAmountMinor: "100000",
      maxAmountMinor: "2000000",
      minTenureDays: 7,
      maxTenureDays: 90,
      annualRate: "20.0000000000",
      interestType: "FLAT",
      interestPaymentMethod: "AMORTIZED",
      repaymentFrequency: "MONTHLY",
      repaymentGracePeriodDays: 0,
      latePaymentGracePeriodDays: 2,
      allocationOrder: ["PENALTY", "FEES", "INTEREST", "PRINCIPAL"],
      autoApprovalEnabled: true,
      configuration: {
        underwriting: {
          version: "POLICY-1",
          minimumKycTier: "TIER_2",
          maxActiveLoans: 1,
          maxTotalExposureToMonthlyIncomeRate: "0.5000000000",
        },
      },
    };
    const version = await products.createVersion({
      tenantId,
      productId: product.id,
      terms,
      effectiveFrom: new Date().toISOString(),
      idempotencyKey: `version-${code}`,
    });
    await products.publish({
      tenantId,
      productId: product.id,
      versionId: version.id,
      approvalId: randomUUID(),
      publisherId: randomUUID(),
      idempotencyKey: `publish-${code}`,
      correlationId: randomUUID(),
    });
    return version.id;
  }
  it("approves a low-risk eligible instant application deterministically and idempotently", async () => {
    const versionId = await published(
      "INSTANT",
      `INSTANT-${randomUUID().slice(0, 8)}`,
    );
    const service = new LoanApplicationService(db);
    const submitted = await service.submit({
      tenantId,
      customerId,
      productVersionId: versionId,
      amountMinor: "1000000",
      tenureDays: 30,
      purpose: "Working capital",
      consentReference: randomUUID(),
      declaredMonthlyIncomeMinor: evidence.monthlyIncomeMinor,
      idempotencyKey: "application-low-risk",
      correlationId: randomUUID(),
    });
    expect(
      (
        await service.submit({
          tenantId,
          customerId,
          productVersionId: versionId,
          amountMinor: "1000000",
          tenureDays: 30,
          purpose: "Working capital",
          consentReference: randomUUID(),
          declaredMonthlyIncomeMinor: evidence.monthlyIncomeMinor,
          idempotencyKey: "application-low-risk",
          correlationId: randomUUID(),
        })
      ).replayed,
    ).toBe(true);
    const decision = await service.evaluate({
      tenantId,
      applicationId: submitted.id,
      evidence,
      idempotencyKey: "evaluation-low-risk",
    });
    expect(decision.decision).toBe("APPROVED");
    expect(
      (
        await service.evaluate({
          tenantId,
          applicationId: submitted.id,
          evidence,
          idempotencyKey: "evaluation-low-risk",
        })
      ).replayed,
    ).toBe(true);
    expect(
      await db("loan_automated_rule_results")
        .where({
          tenant_id: tenantId,
          evaluation_id: decision.evaluationId,
          outcome: "PASS",
        })
        .count<{ count: string }>("*")
        .first(),
    ).toEqual({ count: "4" });
  });
  it("refers business lending even when automated screening passes", async () => {
    const versionId = await published(
      "BUSINESS",
      `BUSINESS-${randomUUID().slice(0, 8)}`,
    );
    const service = new LoanApplicationService(db);
    const submitted = await service.submit({
      tenantId,
      customerId,
      productVersionId: versionId,
      amountMinor: "500000",
      tenureDays: 30,
      purpose: "Inventory",
      consentReference: randomUUID(),
      declaredMonthlyIncomeMinor: evidence.monthlyIncomeMinor,
      idempotencyKey: "application-business",
      correlationId: randomUUID(),
    });
    await expect(
      service.evaluate({
        tenantId,
        applicationId: submitted.id,
        evidence,
        idempotencyKey: "evaluation-business",
      }),
    ).resolves.toMatchObject({ decision: "REFER" });
    expect(
      await db("loan_applications").where({ id: submitted.id }).first("status"),
    ).toEqual({ status: "UNDER_REVIEW" });
  });

  it("requires a bound maker-checker approval for an exceptional manual decision", async () => {
    const versionId = await published(
      "BUSINESS",
      `MANUAL-${randomUUID().slice(0, 8)}`,
    );
    const applications = new LoanApplicationService(db);
    const submitted = await applications.submit({
      tenantId,
      customerId,
      productVersionId: versionId,
      amountMinor: "500000",
      tenureDays: 30,
      purpose: "Inventory",
      consentReference: randomUUID(),
      declaredMonthlyIncomeMinor: evidence.monthlyIncomeMinor,
      idempotencyKey: "application-manual",
      correlationId: randomUUID(),
    });
    await applications.evaluate({
      tenantId,
      applicationId: submitted.id,
      evidence,
      idempotencyKey: "evaluation-manual",
    });
    const reviewerId = randomUUID();
    const checkerId = randomUUID();
    const executorId = randomUUID();
    let consumedBinding:
      { payloadHash: string; resourceId: string } | undefined;
    const manual = new ManualUnderwritingService(db, {
      consume: (input) => {
        consumedBinding = input;
        return Promise.resolve({
          approvalId: input.approvalId,
          replayed: false,
          makerId: reviewerId,
          checkerIds: [checkerId],
          authorityLevel: 2,
          consumedAt: new Date().toISOString(),
        });
      },
    });
    const openInput = {
      tenantId,
      applicationId: submitted.id,
      requiredAuthorityLevel: 2,
      reasonCodes: ["BUSINESS_REVIEW_REQUIRED"],
      idempotencyKey: "open-manual-review",
    };
    const review = await manual.open(openInput);
    await expect(manual.open(openInput)).resolves.toMatchObject({
      id: review.id,
      replayed: true,
    });
    const assignmentInput = {
      tenantId,
      reviewCaseId: review.id,
      reviewerId,
      expectedLockVersion: 0,
      leaseUntil: new Date(Date.now() + 60_000).toISOString(),
      idempotencyKey: "assign-manual-review",
    };
    await expect(manual.assign(assignmentInput)).resolves.toMatchObject({
      lockVersion: 1,
      replayed: false,
    });
    await expect(manual.assign(assignmentInput)).resolves.toMatchObject({
      lockVersion: 1,
      replayed: true,
    });
    expect(
      await db("loan_manual_review_assignments")
        .where({ tenant_id: tenantId, review_case_id: review.id })
        .count<{ count: string }>("*")
        .first(),
    ).toEqual({ count: "1" });
    const recommendation = await manual.recommend({
      tenantId,
      reviewCaseId: review.id,
      reviewerId,
      recommendation: "APPROVED",
      proposedTerms: {
        amountMinor: "450000",
        tenureDays: 30,
        interestRate: "20.0000000000",
      },
      reasonCodes: ["MANUAL_CREDIT_ASSESSMENT_PASS"],
      evidenceReferences: ["evidence://credit-report/synthetic"],
      policyVersion: "POLICY-1",
      idempotencyKey: "recommendation-manual",
    });
    const approvalId = randomUUID();
    const decision = await manual.decide({
      tenantId,
      reviewCaseId: review.id,
      recommendationId: recommendation.id,
      approvalId,
      executorId,
      idempotencyKey: "decision-manual",
      correlationId: randomUUID(),
    });
    expect(decision).toMatchObject({ decision: "APPROVED", replayed: false });
    expect(consumedBinding).toMatchObject({ resourceId: review.id });
    expect(consumedBinding?.payloadHash).toHaveLength(64);
    expect(
      await db("loan_applications").where({ id: submitted.id }).first("status"),
    ).toEqual({ status: "APPROVED" });
    expect(
      (
        await manual.decide({
          tenantId,
          reviewCaseId: review.id,
          recommendationId: recommendation.id,
          approvalId,
          executorId,
          idempotencyKey: "decision-manual",
          correlationId: randomUUID(),
        })
      ).replayed,
    ).toBe(true);
  });
});

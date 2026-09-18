import { createHash, randomUUID } from "node:crypto";
import knex, { type Knex } from "knex";
import {
  LoanApplicationService,
  type UnderwritingEvidence,
} from "../../src/services/loan-application-service.js";
import { LoanDisbursementService } from "../../src/services/loan-disbursement-service.js";
import { CustomerLendingService } from "../../src/services/customer-lending-service.js";
import { LoanResolutionService } from "../../src/services/loan-resolution-service.js";
import { LoanRestructureService } from "../../src/services/loan-restructure-service.js";
import { LoanRepaymentService } from "../../src/services/loan-repayment-service.js";
import { LoanRepaymentReversalService } from "../../src/services/loan-repayment-reversal-service.js";
import { LoanServicingService } from "../../src/services/loan-servicing-service.js";
import {
  generateSchedule,
  LoanOfferService,
} from "../../src/services/loan-offer-service.js";
import {
  LoanProductService,
  type VersionTerms,
} from "../../src/services/loan-product-service.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
const protectedTriggers = [
  ["loan_quotes", "trg_protect_loan_quote"],
  ["loan_repayment_quotes", "trg_protect_repayment_quote"],
  ["loan_repayment_requests", "trg_protect_repayment_request"],
  ["loan_interest_accruals", "trg_protect_final_interest_accrual"],
  ["loan_penalty_assessments", "trg_protect_final_penalty"],
  ["loan_delinquency_assessments", "trg_protect_delinquency_assessment"],
  ["loan_contracts", "trg_protect_signed_contract"],
  ["loan_writeoff_history", "trg_protect_writeoff_history"],
  ["loan_write_off_recoveries", "trg_protect_posted_recovery"],
  ["loan_write_offs", "trg_protect_completed_writeoff"],
  ["loan_restructure_history", "trg_protect_restructure_history"],
  ["loan_repayment_reversals", "trg_protect_final_repayment_reversal"],
  ["loan_repayment_allocation_batches", "trg_protect_final_repayment_batch"],
  ["loan_repayment_allocation_lines", "trg_protect_repayment_lines"],
  ["loan_repayment_lifecycle_history", "trg_protect_repayment_history"],
  ["loan_repayments", "trg_protect_final_repayment"],
  ["loan_offer_acceptances", "trg_protect_offer_acceptance"],
  ["loan_offer_installments", "trg_protect_offer_installment"],
  ["loan_offer_schedules", "trg_protect_offer_schedule"],
  ["loan_offer_fee_lines", "trg_protect_offer_fee"],
  ["loan_offers", "trg_protect_issued_offer"],
  ["loan_application_decisions", "trg_protect_decision"],
  ["loan_automated_rule_results", "trg_protect_rule_result"],
  ["loan_automated_evaluations", "trg_protect_completed_evaluation"],
  ["loan_application_events", "trg_protect_application_events"],
  ["loan_product_version_history", "trg_protect_product_version_history"],
  ["loan_product_versions", "trg_protect_published_product_version"],
] as const;

describe("LN-04 schedule arithmetic", () => {
  it("preserves principal, interest, fees and rounding residuals across generated schedules", () => {
    for (let index = 1; index <= 100; index++) {
      const principal = BigInt(100_000 + index * 7_919);
      const schedule = generateSchedule({
        principal: principal.toString(),
        annualRate: `${5 + (index % 31)}.1234567890`,
        tenureDays: 7 + (index % 720),
        effectiveDate: "2026-09-12",
        frequency: index % 2 ? "MONTHLY" : "WEEKLY",
        interestType: index % 3 ? "REDUCING_BALANCE" : "FLAT",
        dayCountConvention: index % 2 ? "ACTUAL_365" : "ACTUAL_360",
        roundingMode: index % 3 ? "HALF_EVEN" : "HALF_UP",
        fees: [
          {
            code: "PROCESSING",
            description: "Processing fee",
            amountMinor: String(index),
            treatment: "FINANCED",
          },
        ],
      });
      expect(
        schedule.installments.reduce((sum, item) => sum + item.principal, 0n),
      ).toBe(principal);
      expect(
        schedule.installments.reduce((sum, item) => sum + item.interest, 0n),
      ).toBe(schedule.totalInterest);
      expect(
        schedule.installments.reduce((sum, item) => sum + item.fees, 0n),
      ).toBe(BigInt(index));
      expect(schedule.installments.at(-1)?.dueDate).toBe(schedule.maturityDate);
    }
  });
});

describeDatabase("LN-04 immutable offer acceptance", () => {
  let db: Knex;
  const tenantId = randomUUID();
  const customerId = randomUUID();
  beforeAll(async () => {
    db = knex({ client: "pg", connection: databaseUrl! });
    for (const [table, trigger] of protectedTriggers)
      await db.raw(`ALTER TABLE public.${table} ENABLE TRIGGER ${trigger}`);
  });
  afterAll(async () => {
    for (const [table, trigger] of protectedTriggers)
      await db.raw(`ALTER TABLE public.${table} DISABLE TRIGGER ${trigger}`);
    await db("loan_contracts").where({ tenant_id: tenantId }).delete();
    await db("loan_writeoff_history").where({ tenant_id: tenantId }).delete();
    await db("loan_write_off_recoveries")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_write_offs").where({ tenant_id: tenantId }).delete();
    await db("loan_restructure_history")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_restructures").where({ tenant_id: tenantId }).delete();
    await db("loan_repayment_reversals")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_repayment_requests").where({ tenant_id: tenantId }).delete();
    await db("loan_repayment_quotes").where({ tenant_id: tenantId }).delete();
    await db("loan_unapplied_credits").where({ tenant_id: tenantId }).delete();
    await db("loan_repayment_allocation_lines")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_repayment_allocation_batches")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_repayment_lifecycle_history")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_repayments").where({ tenant_id: tenantId }).delete();
    await db("loan_disbursement_saga_steps")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_disbursements").where({ tenant_id: tenantId }).delete();
    await db("loan_penalty_assessments")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_interest_accruals").where({ tenant_id: tenantId }).delete();
    await db("loan_delinquency_assessments")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_installments").where({ tenant_id: tenantId }).delete();
    await db("loan_schedules").where({ tenant_id: tenantId }).delete();
    await db("loans").where({ tenant_id: tenantId }).delete();
    await db("loan_offer_acceptances").where({ tenant_id: tenantId }).delete();
    await db("loan_offer_installments").where({ tenant_id: tenantId }).delete();
    await db("loan_offer_schedules").where({ tenant_id: tenantId }).delete();
    await db("loan_offer_fee_lines").where({ tenant_id: tenantId }).delete();
    await db("loan_offers").where({ tenant_id: tenantId }).delete();
    await db("loan_quotes").where({ tenant_id: tenantId }).delete();
    await db("loan_application_decisions")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_automated_rule_results")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_automated_evaluations")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_application_events").where({ tenant_id: tenantId }).delete();
    await db("loan_outbox_events").where({ tenant_id: tenantId }).delete();
    await db("loan_applications").where({ tenant_id: tenantId }).delete();
    await db("loan_product_version_history")
      .where({ tenant_id: tenantId })
      .delete();
    await db("loan_product_versions").where({ tenant_id: tenantId }).delete();
    await db("loan_products").where({ tenant_id: tenantId }).delete();
    for (const [table, trigger] of protectedTriggers)
      await db.raw(`ALTER TABLE public.${table} ENABLE TRIGGER ${trigger}`);
    await db.destroy();
  });

  it("atomically accepts only the current unexpired document and never stores the raw authorization token", async () => {
    const products = new LoanProductService(db, {
      consume: (input) =>
        Promise.resolve({ approvalId: input.approvalId, replayed: false }),
    });
    const product = await products.createProduct({
      tenantId,
      code: `LN04-${randomUUID().slice(0, 8)}`,
      name: "LN04",
      type: "INSTANT",
      idempotencyKey: "ln04-product",
    });
    const terms: VersionTerms = {
      currency: "NGN",
      minAmountMinor: "100000",
      maxAmountMinor: "2000000",
      minTenureDays: 7,
      maxTenureDays: 365,
      annualRate: "20.0000000000",
      interestType: "REDUCING_BALANCE",
      interestPaymentMethod: "AMORTIZED",
      repaymentFrequency: "MONTHLY",
      repaymentGracePeriodDays: 0,
      latePaymentGracePeriodDays: 2,
      allocationOrder: ["PENALTY", "FEES", "INTEREST", "PRINCIPAL"],
      penalty: {
        type: "FIXED",
        fixedAmountMinor: "500",
        capAmountMinor: "5000",
        frequency: "MONTHLY",
        compounds: false,
      },
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
      idempotencyKey: "ln04-version",
    });
    await products.publish({
      tenantId,
      productId: product.id,
      versionId: version.id,
      approvalId: randomUUID(),
      publisherId: randomUUID(),
      idempotencyKey: "ln04-publish",
      correlationId: randomUUID(),
    });
    let paymentRequests = 0;
    const customerLending = new CustomerLendingService(
      db,
      {
        verify: (input) =>
          Promise.resolve({
            reference: `authorization:${input.resourceId}`,
            customerId: input.customerId,
          }),
      },
      {
        initiate: () => {
          paymentRequests++;
          return Promise.resolve({
            paymentRequestId: randomUUID(),
            status: "PENDING_COLLECTION",
            replayed: false,
          });
        },
      },
    );
    const loanQuoteInput = {
      tenantId,
      customerId,
      productVersionId: version.id,
      amountMinor: "1000000",
      currency: "NGN" as const,
      tenor: 90,
      repaymentFrequency: "monthly" as const,
      purpose: "Inventory",
      idempotencyKey: "ln04-customer-loan-quote",
    };
    const customerQuote = await customerLending.quoteLoan(loanQuoteInput);
    expect(customerQuote.replayed).toBe(false);
    await expect(
      customerLending.quoteLoan(loanQuoteInput),
    ).resolves.toMatchObject({ id: customerQuote.id, replayed: true });
    const evidence: UnderwritingEvidence = {
      kycTier: "TIER_2",
      kycStatus: "VERIFIED",
      kycVerificationReference: "kyc-ln04",
      consentReference: "consent-ln04",
      evidenceObservedAt: new Date().toISOString(),
      evidenceExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      monthlyIncomeMinor: "10000000",
      existingExposureMinor: "0",
      activeLoanCount: 0,
      riskDisposition: "CLEAR",
    };
    const applications = new LoanApplicationService(db);
    const application = await applications.submit({
      tenantId,
      customerId,
      productVersionId: version.id,
      amountMinor: "1000000",
      tenureDays: 90,
      purpose: "Inventory",
      consentReference: randomUUID(),
      declaredMonthlyIncomeMinor: evidence.monthlyIncomeMinor,
      idempotencyKey: "ln04-application",
      correlationId: randomUUID(),
    });
    await applications.evaluate({
      tenantId,
      applicationId: application.id,
      evidence,
      idempotencyKey: "ln04-evaluation",
    });
    const rawToken =
      "synthetic-transaction-authorization-token-that-is-not-stored";
    const service = new LoanOfferService(db, {
      verify: () =>
        Promise.resolve({
          reference: "authz-ln04",
          customerId,
          subject: randomUUID(),
        }),
    });
    const documentHash = createHash("sha256")
      .update("synthetic-contract")
      .digest("hex");
    const offer = await service.issue({
      tenantId,
      applicationId: application.id,
      effectiveDate: "2026-09-12",
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      documentReference: "document://synthetic/contract",
      documentHash,
      idempotencyKey: "ln04-offer",
      correlationId: randomUUID(),
      actorId: randomUUID(),
    });
    const accepted = await service.accept({
      tenantId,
      offerId: offer.id,
      offerVersion: 1,
      customerId,
      authorizationToken: rawToken,
      consentReference: "consent-accept-ln04",
      documentHash,
      idempotencyKey: "ln04-accept",
      correlationId: randomUUID(),
    });
    expect(accepted.replayed).toBe(false);
    expect(
      (
        await service.accept({
          tenantId,
          offerId: offer.id,
          offerVersion: 1,
          customerId,
          authorizationToken: rawToken,
          consentReference: "consent-accept-ln04",
          documentHash,
          idempotencyKey: "ln04-accept",
          correlationId: randomUUID(),
        })
      ).replayed,
    ).toBe(true);
    const acceptance = await db("loan_offer_acceptances")
      .where({ id: accepted.acceptanceId })
      .first<{ authorization_hash: string }>("authorization_hash");
    expect(acceptance.authorization_hash).toBe(
      createHash("sha256").update(rawToken).digest("hex"),
    );
    expect(JSON.stringify(acceptance)).not.toContain(rawToken);
    const totals = await db("loan_installments")
      .where({ loan_id: accepted.loanId })
      .sum<{ principal: string; interest: string }[]>({
        principal: "principal_due",
        interest: "interest_due",
      })
      .first();
    if (!totals) throw new Error("Accepted loan schedule totals not found");
    expect(totals.principal).toBe("1000000");
    expect(typeof totals.interest).toBe("string");
    let reversals = 0;
    const disbursements = new LoanDisbursementService(
      db,
      {
        consume: (approval) =>
          Promise.resolve({
            approvalId: approval.approvalId,
            replayed: false,
            makerId: randomUUID(),
            checkerIds: [randomUUID()],
            authorityLevel: 1,
            consumedAt: new Date().toISOString(),
          }),
      },
      {
        post: () =>
          Promise.resolve({ transactionId: randomUUID(), replayed: false }),
        reverse: () => {
          reversals++;
          return Promise.resolve({
            transactionId: randomUUID(),
            replayed: false,
          });
        },
      },
      {
        submit: () =>
          Promise.resolve({
            paymentId: randomUUID(),
            status: "FAILED",
            replayed: false,
          }),
      },
    );
    await expect(
      disbursements.start({
        tenantId,
        loanId: accepted.loanId,
        destinationReference: "bank-account-token",
        receivableLedgerAccountId: randomUUID(),
        fundingLedgerAccountId: randomUUID(),
        approvalId: randomUUID(),
        executorId: randomUUID(),
        idempotencyKey: "ln05-final-failure",
        correlationId: randomUUID(),
      }),
    ).resolves.toMatchObject({ status: "COMPENSATED" });
    expect(reversals).toBe(1);

    const firstInstallment = await db("loan_installments")
      .where({ tenant_id: tenantId, loan_id: accepted.loanId })
      .orderBy("installment_number")
      .first<{
        id: string;
        principal_due: string;
        interest_due: string;
        fees_due: string;
        penalty_due: string;
      }>();
    if (!firstInstallment)
      throw new Error("Repayment fixture installment not found");
    await db("loans").where({ id: accepted.loanId }).update({
      status: "ACTIVE",
      outstanding_principal: firstInstallment.principal_due,
      outstanding_interest: firstInstallment.interest_due,
      outstanding_fees: firstInstallment.fees_due,
      outstanding_penalties: firstInstallment.penalty_due,
    });
    const servicing = new LoanServicingService(db, {
      post: () =>
        Promise.resolve({ transactionId: randomUUID(), replayed: false }),
    });
    await servicing.accrueInterest({
      tenantId,
      loanId: accepted.loanId,
      installmentId: firstInstallment.id,
      periodStart: "2026-09-12",
      periodEnd: "2026-09-13",
      assessmentDate: "2026-09-13",
      dayCountNumerator: 1,
      dayCountDenominator: 365,
      roundingMode: "HALF_UP",
      calculationPolicyVersion: "SERVICING-1",
      receivableLedgerAccountId: randomUUID(),
      incomeLedgerAccountId: randomUUID(),
      idempotencyKey: "ln07-interest-event-conformance",
      correlationId: randomUUID(),
      causationId: randomUUID(),
    });
    await servicing.assessPenalty({
      tenantId,
      loanId: accepted.loanId,
      installmentId: firstInstallment.id,
      assessmentDate: "2027-12-31",
      periodStart: "2027-12-01",
      periodEnd: "2027-12-31",
      roundingMode: "HALF_UP",
      calculationPolicyVersion: "SERVICING-1",
      receivableLedgerAccountId: randomUUID(),
      incomeLedgerAccountId: randomUUID(),
      idempotencyKey: "ln07-penalty-event-conformance",
      correlationId: randomUUID(),
    });
    await servicing.assessDelinquency({
      tenantId,
      loanId: accepted.loanId,
      assessmentDate: "2027-12-31",
      timezone: "Africa/Lagos",
      idempotencyKey: "ln07-delinquency-event-conformance",
      correlationId: randomUUID(),
    });
    const repaymentQuoteInput = {
      tenantId,
      customerId,
      loanId: accepted.loanId,
      amountMinor: "1000",
      currency: "NGN" as const,
      source: "WALLET" as const,
      idempotencyKey: "ln04-customer-repayment-quote",
    };
    const repaymentQuote =
      await customerLending.quoteRepayment(repaymentQuoteInput);
    await expect(
      customerLending.quoteRepayment(repaymentQuoteInput),
    ).resolves.toMatchObject({ id: repaymentQuote.id, replayed: true });
    const repaymentRequestInput = {
      tenantId,
      customerId,
      loanId: accepted.loanId,
      repaymentQuoteId: repaymentQuote.id,
      authorizationToken: "repayment-authorization-token-value",
      idempotencyKey: "ln04-customer-repayment-request",
      correlationId: randomUUID(),
    };
    const repaymentRequest = await customerLending.requestRepayment(
      repaymentRequestInput,
    );
    expect(repaymentRequest).toMatchObject({
      status: "PENDING_COLLECTION",
      replayed: false,
    });
    await expect(
      customerLending.requestRepayment(repaymentRequestInput),
    ).resolves.toMatchObject({ id: repaymentRequest.id, replayed: true });
    expect(paymentRequests).toBe(1);
    const storedRequest = await db("loan_repayment_requests")
      .where({ id: repaymentRequest.id })
      .first<{ authorization_evidence_hash: string }>(
        "authorization_evidence_hash",
      );
    expect(storedRequest.authorization_evidence_hash).not.toContain(
      repaymentRequestInput.authorizationToken,
    );
    let repaymentReversals = 0;
    const repaymentLedger = {
      post: () =>
        Promise.resolve({ transactionId: randomUUID(), replayed: false }),
      reverse: () => {
        repaymentReversals++;
        return Promise.resolve({
          transactionId: randomUUID(),
          replayed: false,
        });
      },
    };
    const repayment = await new LoanRepaymentService(
      db,
      repaymentLedger,
    ).allocateConfirmedPayment({
      tenantId,
      loanId: accepted.loanId,
      paymentId: randomUUID(),
      sourceEventId: randomUUID(),
      sourceEventType: "payment.collection-confirmed.v1",
      sourcePayloadHash: createHash("sha256").update("repayment").digest("hex"),
      amountMinor: "1000",
      currency: "NGN",
      method: "BANK_TRANSFER",
      receivableLedgerAccountId: randomUUID(),
      cashLedgerAccountId: randomUUID(),
      unappliedCreditLedgerAccountId: randomUUID(),
      idempotencyKey: "ln06-repayment-for-reversal",
      correlationId: randomUUID(),
      causationId: randomUUID(),
    });
    const reversalInput = {
      tenantId,
      repaymentId: repayment.repaymentId,
      reason: "AUTOMATED_FAILED_TRANSACTION_REVERSAL",
      authorityType: "AUTOMATED_RULE" as const,
      authorityId: randomUUID(),
      authorityPayloadHash: createHash("sha256")
        .update("approved-rule")
        .digest("hex"),
      correlationId: randomUUID(),
    };
    const reversalService = new LoanRepaymentReversalService(
      db,
      repaymentLedger,
    );
    await expect(reversalService.reverse(reversalInput)).resolves.toMatchObject(
      { status: "POSTED" },
    );
    await expect(reversalService.reverse(reversalInput)).resolves.toMatchObject(
      { status: "POSTED", replayed: true },
    );
    expect(repaymentReversals).toBe(1);
    const reversedBatch = await db("loan_repayment_allocation_batches")
      .where({ tenant_id: tenantId, repayment_id: repayment.repaymentId })
      .first<{ id: string }>("id");
    if (!reversedBatch) throw new Error("Reversed allocation batch not found");
    await expect(
      db("loan_repayment_allocation_batches")
        .where({ id: reversedBatch.id })
        .update({ allocated_amount: "1" }),
    ).rejects.toThrow(/immutable/);
    await expect(
      db("loan_repayments")
        .where({ id: repayment.repaymentId })
        .update({ amount: "1" }),
    ).rejects.toThrow(/immutable/);

    await db("loans").where({ id: accepted.loanId }).update({
      status: "OVERDUE",
      days_past_due: 120,
      outstanding_principal: "900000",
      outstanding_interest: "50000",
      outstanding_fees: "10000",
      outstanding_penalties: "5000",
    });
    const restructureExecutor = randomUUID();
    let restructurePostings = 0;
    const restructures = new LoanRestructureService(
      db,
      {
        consume: (approval) =>
          Promise.resolve({
            approvalId: approval.approvalId,
            replayed: false,
            makerId: randomUUID(),
            checkerIds: [randomUUID()],
            authorityLevel: 2,
            consumedAt: new Date().toISOString(),
          }),
      },
      {
        postRestructure: () => {
          restructurePostings++;
          return Promise.resolve({
            transactionId: randomUUID(),
            replayed: false,
          });
        },
      },
    );
    const restructureInput = {
      tenantId,
      loanId: accepted.loanId,
      approvalId: randomUUID(),
      executorId: restructureExecutor,
      reasonCode: "AFFORDABILITY_RESTRUCTURE",
      proposedTerms: {
        principalMinor: "900000",
        annualRate: "15.0000000000",
        tenureDays: 120,
        effectiveDate: "2026-09-12",
        capitalizedAmountMinor: "0",
        capitalizationAuthorized: false,
      },
      calculationPolicyVersion: "RESTRUCTURE-1",
      receivableLedgerAccountId: randomUUID(),
      adjustmentLedgerAccountId: randomUUID(),
      idempotencyKey: "ln08-restructure",
      correlationId: randomUUID(),
    };
    await expect(
      restructures.restructure(restructureInput),
    ).resolves.toMatchObject({ status: "IMPLEMENTED" });
    await expect(
      restructures.restructure(restructureInput),
    ).resolves.toMatchObject({ status: "IMPLEMENTED", replayed: true });
    expect(restructurePostings).toBe(1);
    expect(
      await db("loan_schedules")
        .where({
          tenant_id: tenantId,
          loan_id: accepted.loanId,
          is_active: true,
        })
        .count<{ count: string }>("*")
        .first(),
    ).toEqual({ count: "1" });
    const restructuredBalances = await db("loans")
      .where({ id: accepted.loanId })
      .first<{ outstanding_interest: string }>("outstanding_interest");
    if (!restructuredBalances) throw new Error("Restructured loan not found");
    const executorId = randomUUID();
    const ledgerTransactionId = randomUUID();
    let writeOffPostings = 0;
    const resolutions = new LoanResolutionService(
      db,
      {
        consume: (approval) =>
          Promise.resolve({
            approvalId: approval.approvalId,
            replayed: false,
            makerId: randomUUID(),
            checkerIds: [randomUUID()],
            authorityLevel: 2,
            consumedAt: new Date().toISOString(),
          }),
      },
      {
        postWriteOff: (command) => {
          writeOffPostings++;
          expect(command.balances).toEqual({
            principal: "900000",
            interest: restructuredBalances.outstanding_interest,
            fees: "10000",
            penalty: "5000",
          });
          return Promise.resolve({
            transactionId: ledgerTransactionId,
            replayed: false,
          });
        },
        postRecovery: () =>
          Promise.resolve({ transactionId: randomUUID(), replayed: false }),
      },
    );
    const writeOffInput = {
      tenantId,
      loanId: accepted.loanId,
      approvalId: randomUUID(),
      executorId,
      reasonCode: "POLICY_DPD_THRESHOLD",
      expenseLedgerAccountId: randomUUID(),
      receivableLedgerAccountIds: {
        principal: randomUUID(),
        interest: randomUUID(),
        fees: randomUUID(),
        penalty: randomUUID(),
      },
      idempotencyKey: "ln08-writeoff",
      correlationId: randomUUID(),
    };
    const writtenOff = await resolutions.writeOff(writeOffInput);
    expect(writtenOff).toMatchObject({ status: "COMPLETED" });
    await expect(resolutions.writeOff(writeOffInput)).resolves.toMatchObject({
      status: "COMPLETED",
      replayed: true,
    });
    expect(writeOffPostings).toBe(1);
    expect(
      await db("loans").where({ id: accepted.loanId }).first("status"),
    ).toMatchObject({ status: "WRITTEN_OFF" });
    expect(
      await db("loan_outbox_events")
        .where({ tenant_id: tenantId, event_type: "loan.written-off.v1" })
        .count<{ count: string }>("*")
        .first(),
    ).toEqual({ count: "1" });
    const recoveryInput = {
      tenantId,
      loanId: accepted.loanId,
      writeOffId: writtenOff.id,
      paymentId: randomUUID(),
      sourceEventId: randomUUID(),
      sourcePayloadHash: createHash("sha256")
        .update("recovery-event")
        .digest("hex"),
      amountMinor: "20000",
      method: "BANK_TRANSFER" as const,
      cashLedgerAccountId: randomUUID(),
      recoveryLedgerAccountIds: {
        principal: randomUUID(),
        interest: randomUUID(),
        fees: randomUUID(),
        penalty: randomUUID(),
      },
      idempotencyKey: "ln08-recovery",
      correlationId: randomUUID(),
      causationId: randomUUID(),
    };
    await expect(
      resolutions.postWriteOffRecovery(recoveryInput),
    ).resolves.toMatchObject({ status: "POSTED" });
    await expect(
      resolutions.postWriteOffRecovery(recoveryInput),
    ).resolves.toMatchObject({ status: "POSTED", replayed: true });
    expect(
      await db("loans").where({ id: accepted.loanId }).first("status"),
    ).toMatchObject({ status: "WRITTEN_OFF" });
    expect(
      await db("loan_outbox_events")
        .where({
          tenant_id: tenantId,
          event_type: "loan.writeoff-recovery-posted.v1",
        })
        .count<{ count: string }>("*")
        .first(),
    ).toEqual({ count: "1" });

    const requiredEventFields: Record<string, string[]> = {
      "loan.interest-accrued.v1": [
        "loan_id",
        "accrual_id",
        "period_start",
        "period_end",
        "amount_minor",
        "currency",
        "ledger_transaction_id",
      ],
      "loan.penalty-assessed.v1": [
        "loan_id",
        "installment_id",
        "penalty_assessment_id",
        "assessment_date",
        "amount_minor",
        "cumulative_amount_minor",
        "currency",
        "ledger_transaction_id",
      ],
      "loan.delinquency-changed.v1": [
        "loan_id",
        "assessment_id",
        "assessment_date",
        "days_past_due",
        "bucket",
        "outstanding_amount_minor",
        "currency",
      ],
      "loan.repayment-reversed.v1": [
        "loan_id",
        "repayment_id",
        "reversal_id",
        "ledger_transaction_id",
        "amount_minor",
        "currency",
        "authority_type",
        "authority_id",
      ],
      "loan.restructured.v1": [
        "loan_id",
        "restructure_id",
        "new_schedule_id",
        "ledger_transaction_id",
        "currency",
      ],
      "loan.written-off.v1": [
        "loan_id",
        "writeoff_id",
        "total_amount_minor",
        "ledger_transaction_id",
        "currency",
      ],
      "loan.writeoff-recovery-posted.v1": [
        "loan_id",
        "writeoff_id",
        "recovery_id",
        "payment_id",
        "amount_minor",
        "ledger_transaction_id",
        "currency",
      ],
    };
    const producedEvents = await db("loan_outbox_events")
      .where({ tenant_id: tenantId })
      .whereIn("event_type", Object.keys(requiredEventFields))
      .select<{ event_type: string; payload: Record<string, unknown> }[]>(
        "event_type",
        "payload",
      );
    expect(producedEvents.map((event) => event.event_type)).toEqual(
      expect.arrayContaining(Object.keys(requiredEventFields)),
    );
    for (const event of producedEvents) {
      for (const field of requiredEventFields[event.event_type] ?? []) {
        expect(event.payload).toHaveProperty(field);
        if (field.endsWith("_minor")) {
          expect(typeof event.payload[field]).toBe("string");
          expect(event.payload[field]).toMatch(/^\d+$/);
        }
      }
    }
  });
});

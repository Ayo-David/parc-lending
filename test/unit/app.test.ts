import type { AddressInfo } from "node:net";
import { once } from "node:events";
import { jest } from "@jest/globals";
import { createApp, type LendingCommandHandlers } from "../../src/app.js";

const ids = {
  tenant: "11111111-1111-4111-8111-111111111111",
  loan: "22222222-2222-4222-8222-222222222222",
  approval: "33333333-3333-4333-8333-333333333333",
  executor: "44444444-4444-4444-8444-444444444444",
  correlation: "55555555-5555-4555-8555-555555555555",
  receivable: "66666666-6666-4666-8666-666666666666",
  funding: "77777777-7777-4777-8777-777777777777",
};
const authenticator = {
  authenticate: () =>
    Promise.resolve({ tenantId: ids.tenant, subjectId: ids.executor }),
};

test("validates and maps the contracted disbursement command", async () => {
  let received: Record<string, unknown> | undefined;
  let versionReceived: Record<string, unknown> | undefined;
  let applicationReceived: Record<string, unknown> | undefined;
  const handlers: LendingCommandHandlers = {
    createProduct: () => Promise.resolve({}),
    createProductVersion: (input) => {
      versionReceived = input;
      return Promise.resolve({ id: ids.loan, version: 1 });
    },
    publishProduct: () => Promise.resolve({}),
    submitApplication: (input) => {
      applicationReceived = input;
      return Promise.resolve({ id: ids.loan, status: "SUBMITTED" });
    },
    evaluateApplication: () => Promise.resolve({}),
    openManualReview: () => Promise.resolve({}),
    assignManualReview: () => Promise.resolve({}),
    recommendManualDecision: () => Promise.resolve({}),
    decideApplicationManually: () => Promise.resolve({}),
    issueOffer: () => Promise.resolve({}),
    acceptOffer: () => Promise.resolve({}),
    listCustomerProducts: () => Promise.resolve([]),
    quoteCustomerLoan: () => Promise.resolve({}),
    getCustomerApplication: () => Promise.resolve({}),
    getCustomerOffer: () => Promise.resolve({}),
    listCustomerLoans: () => Promise.resolve([]),
    quoteCustomerRepayment: () => Promise.resolve({}),
    requestCustomerRepayment: () => Promise.resolve({}),
    disburse: (input) => {
      received = input;
      return Promise.resolve({ id: ids.loan, status: "PENDING" });
    },
    recordRepayment: () => Promise.resolve({}),
    restructure: () => Promise.resolve({}),
    writeOff: () => Promise.resolve({}),
    postWriteOffRecovery: () => Promise.resolve({}),
    reverseRepayment: () => Promise.resolve({}),
  };
  const server = createApp(handlers, authenticator).listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const port = (server.address() as AddressInfo).port;
    const response = await fetch(
      `http://127.0.0.1:${port}/internal/v1/loans/${ids.loan}/disburse`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer service-token",
          "content-type": "application/json",
          "x-tenant-id": ids.tenant,
          "idempotency-key": "disburse-1",
        },
        body: JSON.stringify({
          destination_reference: "bank-account-ref",
          receivable_ledger_account_id: ids.receivable,
          funding_ledger_account_id: ids.funding,
          approval_id: ids.approval,
          executor_id: ids.executor,
          correlation_id: ids.correlation,
        }),
      },
    );
    expect(response.status).toBe(202);
    expect(received).toMatchObject({
      tenantId: ids.tenant,
      loanId: ids.loan,
      idempotencyKey: "disburse-1",
      destinationReference: "bank-account-ref",
      receivableLedgerAccountId: ids.receivable,
      fundingLedgerAccountId: ids.funding,
    });
    const versionResponse = await fetch(
      `http://127.0.0.1:${port}/v1/loan-products/${ids.loan}/versions`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer admin-token",
          "content-type": "application/json",
          "x-tenant-id": ids.tenant,
          "idempotency-key": "version-1",
        },
        body: JSON.stringify({
          interest_method: "REDUCING_BALANCE",
          interest_payment_method: "AMORTIZED",
          annual_rate: "20.0000000000",
          allocation_order: ["PENALTY", "FEES", "INTEREST", "PRINCIPAL"],
          currency: "NGN",
          min_amount_minor: "100000",
          max_amount_minor: "2000000",
          min_tenure_days: 7,
          max_tenure_days: 365,
          repayment_frequency: "MONTHLY",
          repayment_grace_period_days: 0,
          late_payment_grace_period_days: 2,
          effective_from: "2026-09-12T00:00:00.000Z",
        }),
      },
    );
    expect(versionResponse.status).toBe(201);
    expect(versionReceived).toMatchObject({
      tenantId: ids.tenant,
      productId: ids.loan,
      effectiveFrom: "2026-09-12T00:00:00.000Z",
      terms: {
        interestType: "REDUCING_BALANCE",
        interestPaymentMethod: "AMORTIZED",
        minAmountMinor: "100000",
      },
    });
    const applicationResponse = await fetch(
      `http://127.0.0.1:${port}/v1/loan-applications`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer test-token",
          "content-type": "application/json",
          "x-tenant-id": ids.tenant,
          "idempotency-key": "application-1",
        },
        body: JSON.stringify({
          product_version_id: ids.loan,
          amount_minor: "500000",
          currency: "NGN",
          tenure_days: 90,
          purpose: "Working capital",
          correlation_id: ids.correlation,
          underwriting_evidence: {
            kyc_tier: "TIER_2",
            kyc_status: "VERIFIED",
            kyc_verification_reference: "kyc-ref",
            consent_reference: "consent-ref",
            evidence_observed_at: "2026-09-12T00:00:00.000Z",
            evidence_expires_at: "2026-09-13T00:00:00.000Z",
            monthly_income_minor: "1000000",
            existing_exposure_minor: "0",
            active_loan_count: 0,
            fraud_flag: false,
          },
        }),
      },
    );
    expect(applicationResponse.status).toBe(202);
    expect(applicationReceived).toMatchObject({
      tenantId: ids.tenant,
      customerId: ids.executor,
      productVersionId: ids.loan,
      tenureDays: 90,
      evidence: {
        kycTier: "TIER_2",
        monthlyIncomeMinor: "1000000",
      },
    });
  } finally {
    server.close();
  }
});

test("rejects malformed commands before invoking a handler", async () => {
  const handler = jest.fn<(input: Record<string, unknown>) => Promise<unknown>>(
    () => Promise.resolve({}),
  );
  const server = createApp(
    {
      createProduct: handler,
      createProductVersion: handler,
      publishProduct: handler,
      submitApplication: handler,
      evaluateApplication: handler,
      openManualReview: handler,
      assignManualReview: handler,
      recommendManualDecision: handler,
      decideApplicationManually: handler,
      issueOffer: handler,
      acceptOffer: handler,
      listCustomerProducts: handler,
      quoteCustomerLoan: handler,
      getCustomerApplication: handler,
      getCustomerOffer: handler,
      listCustomerLoans: handler,
      quoteCustomerRepayment: handler,
      requestCustomerRepayment: handler,
      disburse: handler,
      recordRepayment: handler,
      restructure: handler,
      writeOff: handler,
      postWriteOffRecovery: handler,
      reverseRepayment: handler,
    },
    authenticator,
  ).listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const port = (server.address() as AddressInfo).port;
    const response = await fetch(
      `http://127.0.0.1:${port}/v1/loans/not-a-uuid/write-offs`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      },
    );
    expect(response.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
  } finally {
    server.close();
  }
});

import { jest } from "@jest/globals";
import { FinancialHttpGateways } from "../../src/runtime/financial-http-gateways.js";

describe("FinancialHttpGateways service credentials", () => {
  const tenantId = "11111111-1111-4111-8111-111111111111";
  const fetchMock = jest.fn<typeof fetch>();
  const gateways = new FinancialHttpGateways(
    "http://ledger.test",
    "http://payment.test",
    {
      authorization: ({ audience }: { audience: string }) =>
        Promise.resolve(
          audience === "parc-ledger"
            ? "Bearer lending-ledger-token-0123456789abcdef"
            : "Bearer lending-payment-token-0123456789abcde",
        ),
    },
  );

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it("posts to Ledger with a Ledger-audience Auth token", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { transaction_id: "tx-1", replayed: false },
        { status: 201 },
      ),
    );
    await expect(
      gateways.simpleLedger().post({
        tenantId,
        idempotencyKey: "loan-disbursement-1",
        reference: "LOAN-1",
        currency: "NGN",
        debitAccountId: "debit-account",
        creditAccountId: "credit-account",
        amountMinor: "500000",
      }),
    ).resolves.toEqual({ transactionId: "tx-1", replayed: false });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://ledger.test/internal/v1/postings");
    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toBe(
      "Bearer lending-ledger-token-0123456789abcdef",
    );
    expect(headers.get("x-calling-service")).toBe("parc-lending");
    expect(headers.get("x-internal-service-token")).toBeNull();
  });

  it("requests a separate Payment-audience token for Payment", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { payment_request_id: "pr-1", status: "PENDING_COLLECTION" },
        { status: 201 },
      ),
    );
    await gateways.paymentCollection().initiate({
      tenantId,
      customerId: "customer-1",
      loanId: "loan-1",
      repaymentRequestId: "repayment-1",
      amountMinor: "1000",
      currency: "NGN",
      source: "WALLET",
      idempotencyKey: "repayment-1",
      correlationId: "correlation-1",
    });
    const headers = new Headers(fetchMock.mock.calls[0]![1]?.headers);
    expect(headers.get("authorization")).toBe(
      "Bearer lending-payment-token-0123456789abcde",
    );
  });
});

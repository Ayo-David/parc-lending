type Entry = {
  account_id: string;
  direction: "DEBIT" | "CREDIT";
  amount_minor: string;
};

export class FinancialHttpGateways {
  public constructor(
    private readonly ledgerUrl: string,
    private readonly paymentUrl: string,
    private readonly serviceToken: string,
    private readonly timeoutMs = 5_000,
  ) {}

  public simpleLedger() {
    return {
      post: (input: {
        tenantId: string;
        idempotencyKey: string;
        reference: string;
        currency: string;
        debitAccountId: string;
        creditAccountId: string;
        amountMinor: string;
      }) =>
        this.posting(input, [
          {
            account_id: input.debitAccountId,
            direction: "DEBIT",
            amount_minor: input.amountMinor,
          },
          {
            account_id: input.creditAccountId,
            direction: "CREDIT",
            amount_minor: input.amountMinor,
          },
        ]),
    };
  }

  public repaymentLedger() {
    return {
      post: (input: {
        tenantId: string;
        idempotencyKey: string;
        reference: string;
        currency: "NGN";
        debitAccountId: string;
        creditLines: Array<{ accountId: string; amountMinor: string }>;
      }) =>
        this.posting(input, [
          {
            account_id: input.debitAccountId,
            direction: "DEBIT",
            amount_minor: sum(
              input.creditLines.map((line) => line.amountMinor),
            ),
          },
          ...input.creditLines
            .filter((line) => BigInt(line.amountMinor) > 0n)
            .map((line) => ({
              account_id: line.accountId,
              direction: "CREDIT" as const,
              amount_minor: line.amountMinor,
            })),
        ]),
      reverse: (input: {
        tenantId: string;
        transactionId: string;
        idempotencyKey: string;
        reason: string;
        authorityType: "APPROVAL" | "AUTOMATED_RULE";
        authorityId: string;
      }) => this.reversal(input),
    };
  }

  public disbursementLedger() {
    return {
      ...this.simpleLedger(),
      reverse: (input: {
        tenantId: string;
        transactionId: string;
        idempotencyKey: string;
        reason: string;
        automatedRuleId: string;
      }) =>
        this.reversal({
          ...input,
          authorityType: "AUTOMATED_RULE",
          authorityId: input.automatedRuleId,
        }),
    };
  }

  public restructureLedger() {
    return {
      postRestructure: (input: {
        tenantId: string;
        idempotencyKey: string;
        reference: string;
        currency: "NGN";
        previousBalances: Record<
          "principal" | "interest" | "fees" | "penalty",
          string
        >;
        newPrincipalMinor: string;
        newInterestMinor: string;
        receivableLedgerAccountId: string;
        adjustmentLedgerAccountId: string;
      }) => {
        const oldTotal = BigInt(sum(Object.values(input.previousBalances)));
        const newTotal =
          BigInt(input.newPrincipalMinor) + BigInt(input.newInterestMinor);
        const difference = newTotal - oldTotal;
        if (difference === 0n)
          return Promise.resolve({
            transactionId: input.reference,
            replayed: true,
          });
        const amount = (difference < 0n ? -difference : difference).toString();
        return this.posting(
          input,
          difference > 0n
            ? [
                {
                  account_id: input.receivableLedgerAccountId,
                  direction: "DEBIT",
                  amount_minor: amount,
                },
                {
                  account_id: input.adjustmentLedgerAccountId,
                  direction: "CREDIT",
                  amount_minor: amount,
                },
              ]
            : [
                {
                  account_id: input.adjustmentLedgerAccountId,
                  direction: "DEBIT",
                  amount_minor: amount,
                },
                {
                  account_id: input.receivableLedgerAccountId,
                  direction: "CREDIT",
                  amount_minor: amount,
                },
              ],
        );
      },
    };
  }

  public resolutionLedger() {
    return {
      postWriteOff: (input: {
        tenantId: string;
        idempotencyKey: string;
        reference: string;
        currency: "NGN";
        balances: Record<string, string>;
        expenseLedgerAccountId: string;
        receivableLedgerAccountIds: Record<string, string>;
      }) =>
        this.posting(input, [
          {
            account_id: input.expenseLedgerAccountId,
            direction: "DEBIT",
            amount_minor: sum(Object.values(input.balances)),
          },
          ...nonzeroLines(
            input.balances,
            input.receivableLedgerAccountIds,
            "CREDIT",
          ),
        ]),
      postRecovery: (input: {
        tenantId: string;
        idempotencyKey: string;
        reference: string;
        currency: "NGN";
        allocations: Record<string, string>;
        cashLedgerAccountId: string;
        recoveryLedgerAccountIds: Record<string, string>;
      }) =>
        this.posting(input, [
          {
            account_id: input.cashLedgerAccountId,
            direction: "DEBIT",
            amount_minor: sum(Object.values(input.allocations)),
          },
          ...nonzeroLines(
            input.allocations,
            input.recoveryLedgerAccountIds,
            "CREDIT",
          ),
        ]),
    };
  }

  public paymentPayout() {
    return {
      submit: async (input: {
        tenantId: string;
        sourceResourceId: string;
        customerId: string;
        ledgerTransactionId: string;
        destinationReference: string;
        amountMinor: string;
        currency: "NGN";
        idempotencyKey: string;
        correlationId: string;
      }) => {
        const result = await this.post(
          this.paymentUrl,
          "/internal/v1/service-payouts",
          input.tenantId,
          input.idempotencyKey,
          {
            source_service: "parc-lending",
            source_resource_id: input.sourceResourceId,
            customer_id: input.customerId,
            ledger_transaction_id: input.ledgerTransactionId,
            destination_reference: input.destinationReference,
            amount_minor: input.amountMinor,
            currency: input.currency,
            narration: "Loan disbursement",
            correlation_id: input.correlationId,
          },
        );
        return {
          paymentId: required(result, "id"),
          status: payoutStatus(required(result, "status")),
          replayed: result.replayed === true,
        };
      },
    };
  }

  public paymentCollection() {
    return {
      initiate: async (input: {
        tenantId: string;
        customerId: string;
        loanId: string;
        repaymentRequestId: string;
        amountMinor: string;
        currency: "NGN";
        source: string;
        collectionReference?: string;
        idempotencyKey: string;
        correlationId: string;
      }) => {
        const result = await this.post(
          this.paymentUrl,
          "/internal/v1/service-collections",
          input.tenantId,
          input.idempotencyKey,
          {
            source_service: "parc-lending",
            source_resource_id: input.repaymentRequestId,
            customer_id: input.customerId,
            amount_minor: input.amountMinor,
            currency: input.currency,
            source: input.source.toLowerCase(),
            ...(input.collectionReference
              ? { collection_reference: input.collectionReference }
              : {}),
            correlation_id: input.correlationId,
          },
        );
        return {
          paymentRequestId: required(result, "payment_request_id"),
          status: required(result, "status") as
            "PENDING_COLLECTION" | "PENDING_MATCH",
          replayed: result.replayed === true,
        };
      },
    };
  }

  private async posting(
    input: {
      tenantId: string;
      idempotencyKey: string;
      reference: string;
      currency: string;
    },
    entries: Entry[],
  ): Promise<{ transactionId: string; replayed: boolean }> {
    const result = await this.post(
      this.ledgerUrl,
      "/internal/v1/postings",
      input.tenantId,
      input.idempotencyKey,
      {
        reference: input.reference.slice(0, 100),
        currency: input.currency,
        entries,
      },
    );
    return {
      transactionId: required(result, "transaction_id"),
      replayed: result.replayed === true,
    };
  }
  private async reversal(input: {
    tenantId: string;
    transactionId: string;
    idempotencyKey: string;
    reason: string;
    authorityType: "APPROVAL" | "AUTOMATED_RULE";
    authorityId: string;
  }): Promise<{ transactionId: string; replayed: boolean }> {
    const result = await this.post(
      this.ledgerUrl,
      `/internal/v1/transactions/${input.transactionId}/reversals`,
      input.tenantId,
      input.idempotencyKey,
      {
        reason: input.reason,
        ...(input.authorityType === "APPROVAL"
          ? { approval_id: input.authorityId }
          : { automated_rule_id: input.authorityId }),
      },
    );
    return {
      transactionId: required(result, "reversal_transaction_id"),
      replayed: result.replayed === true,
    };
  }
  private async post(
    base: string,
    path: string,
    tenantId: string,
    idempotencyKey: string,
    body: object,
  ): Promise<Record<string, unknown>> {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.serviceToken}`,
        "content-type": "application/json",
        "x-tenant-id": tenantId,
        "idempotency-key": idempotencyKey,
        "x-calling-service": "parc-lending",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    const result: unknown = await response.json();
    if (!response.ok)
      throw new Error(`Financial service request failed (${response.status})`);
    return result as Record<string, unknown>;
  }
}

function sum(values: string[]): string {
  return values.reduce((total, value) => total + BigInt(value), 0n).toString();
}
function nonzeroLines(
  amounts: Record<string, string>,
  accounts: Record<string, string>,
  direction: "DEBIT" | "CREDIT",
): Entry[] {
  return Object.entries(amounts)
    .filter(([, amount]) => BigInt(amount) > 0n)
    .map(([key, amount]) => ({
      account_id: accounts[key]!,
      direction,
      amount_minor: amount,
    }));
}
function required(value: Record<string, unknown>, key: string): string {
  if (typeof value[key] !== "string")
    throw new Error(`Financial response is missing ${key}`);
  return value[key];
}
function payoutStatus(value: string): "PENDING" | "SUCCEEDED" | "FAILED" {
  if (value === "SUCCEEDED" || value === "FAILED") return value;
  return "PENDING";
}

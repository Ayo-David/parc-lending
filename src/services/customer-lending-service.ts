import { createHash, randomUUID } from "node:crypto";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import type { Knex } from "knex";
import { withTenantTransaction } from "../database/client.js";
import { generateSchedule } from "./loan-offer-service.js";

export interface RepaymentAuthorizationVerifier {
  verify(input: {
    tenantId: string;
    customerId: string;
    action: "CREATE_LOAN_REPAYMENT";
    resourceId: string;
    token: string;
  }): Promise<{ reference: string; customerId: string }>;
}

export interface PaymentCollectionGateway {
  initiate(input: {
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
  }): Promise<{
    paymentRequestId: string;
    status: "PENDING_COLLECTION" | "PENDING_MATCH";
    replayed: boolean;
  }>;
}

interface LoanQuoteResult {
  id: string;
  amountMinor: string;
  currency: string;
  totalInterestMinor: string;
  totalFeesMinor: string;
  totalRepayableMinor: string;
  maturityDate: unknown;
  schedule: unknown;
  expiresAt: unknown;
  replayed: boolean;
}

interface RepaymentQuoteResult {
  id: string;
  loanId: string;
  amountMinor: string;
  currency: string;
  source: string;
  allocationPreview: unknown;
  expiresAt: unknown;
  replayed: boolean;
}

interface RepaymentRequestResult {
  id: string;
  status: string;
  paymentRequestId: string | null;
  replayed: boolean;
}

export class CustomerLendingService {
  constructor(
    private readonly db: Knex,
    private readonly authorizations: RepaymentAuthorizationVerifier,
    private readonly payments: PaymentCollectionGateway,
  ) {}

  listProducts(input: { tenantId: string }) {
    return withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loan_product_versions as v")
        .join("loan_products as p", function () {
          this.on("p.id", "=", "v.loan_product_id").andOn(
            "p.tenant_id",
            "=",
            "v.tenant_id",
          );
        })
        .where({
          "v.tenant_id": input.tenantId,
          "v.status": "PUBLISHED",
          "v.is_current": true,
          "v.activated_for_tenant": true,
          "p.is_active": true,
        })
        .select(
          "p.id",
          "p.product_code as code",
          "p.product_name as name",
          "p.product_type as type",
          "v.id as product_version_id",
          "v.min_amount as min_amount_minor",
          "v.max_amount as max_amount_minor",
          "v.min_tenure_days",
          "v.max_tenure_days",
          "v.interest_rate as annual_rate",
          "v.currency",
        ),
    );
  }

  async quoteLoan(input: {
    tenantId: string;
    customerId: string;
    productVersionId: string;
    amountMinor: string;
    currency: "NGN";
    tenor: number;
    repaymentFrequency: "daily" | "weekly" | "monthly";
    purpose?: string;
    employerName?: string;
    monthlySalaryMinor?: string;
    assetType?: string;
    assetValueMinor?: string;
    vendorId?: string;
    idempotencyKey: string;
  }): Promise<LoanQuoteResult> {
    const requestHash = hash(input);
    const replay = await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loan_quotes")
        .where({
          tenant_id: input.tenantId,
          idempotency_key: input.idempotencyKey,
        })
        .first(),
    );
    if (replay) {
      if (replay.request_hash !== requestHash)
        throw new Error("Idempotency key reused with a different loan quote");
      return wireLoanQuote(replay, true);
    }
    const version = await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loan_product_versions")
        .where({
          tenant_id: input.tenantId,
          id: input.productVersionId,
          status: "PUBLISHED",
          is_current: true,
          activated_for_tenant: true,
          currency: "NGN",
        })
        .first(),
    );
    if (!version)
      throw new Error("Published loan product version is unavailable");
    if (
      BigInt(input.amountMinor) < BigInt(version.min_amount) ||
      BigInt(input.amountMinor) > BigInt(version.max_amount) ||
      input.tenor < version.min_tenure_days ||
      input.tenor > version.max_tenure_days
    )
      throw new Error("Requested quote is outside product boundaries");
    const frequency = input.repaymentFrequency.toUpperCase() as
      "DAILY" | "WEEKLY" | "MONTHLY";
    if (frequency !== version.repayment_frequency)
      throw new Error("Repayment frequency does not match the product version");
    if (version.interest_type === "DAILY_REDUCING_BALANCE")
      throw new Error("Daily reducing balance quoting is not enabled");
    const effectiveDate = new Date().toISOString().slice(0, 10);
    const fees = parseFees(version.fee_snapshot);
    const schedule = generateSchedule({
      principal: input.amountMinor,
      annualRate: version.interest_rate,
      tenureDays: input.tenor,
      effectiveDate,
      frequency,
      interestType: version.interest_type,
      dayCountConvention: version.day_count_convention,
      roundingMode: version.rounding_mode,
      fees,
    });
    const totalFees = fees
      .filter((fee) => fee.treatment === "FINANCED")
      .reduce((sum, fee) => sum + BigInt(fee.amountMinor), 0n);
    const wireSchedule = schedule.installments.map((item) => ({
      installment_number: item.number,
      due_date: item.dueDate,
      principal_minor: item.principal.toString(),
      interest_minor: item.interest.toString(),
      fees_minor: item.fees.toString(),
      total_minor: (item.principal + item.interest + item.fees).toString(),
    }));
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
    const row = {
      id,
      tenant_id: input.tenantId,
      customer_id: input.customerId,
      product_version_id: input.productVersionId,
      amount: input.amountMinor,
      currency: "NGN",
      tenure_days: input.tenor,
      repayment_frequency: frequency,
      purpose: input.purpose,
      customer_inputs: JSON.stringify({
        employer_name: input.employerName,
        monthly_salary_minor: input.monthlySalaryMinor,
        asset_type: input.assetType,
        asset_value_minor: input.assetValueMinor,
        vendor_id: input.vendorId,
      }),
      total_interest: schedule.totalInterest.toString(),
      total_fees: totalFees.toString(),
      total_repayable: (
        BigInt(input.amountMinor) +
        schedule.totalInterest +
        totalFees
      ).toString(),
      maturity_date: schedule.maturityDate,
      schedule: JSON.stringify(wireSchedule),
      configuration_hash: version.configuration_hash,
      calculation_policy_version: version.calculation_policy_version,
      calculation_input_hash: hash({ input, effectiveDate }),
      calculation_output_hash: hash(wireSchedule),
      idempotency_key: input.idempotencyKey,
      request_hash: requestHash,
      expires_at: expiresAt,
    };
    await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loan_quotes").insert(row),
    );
    return wireLoanQuote(row, false);
  }

  getApplication(input: {
    tenantId: string;
    customerId: string;
    applicationId: string;
  }) {
    return withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const row = await tx("loan_applications")
        .where({
          tenant_id: input.tenantId,
          customer_id: input.customerId,
          id: input.applicationId,
        })
        .first();
      if (!row) throw new Error("Customer loan application not found");
      return row;
    });
  }

  getOffer(input: {
    tenantId: string;
    customerId: string;
    applicationId: string;
  }) {
    return withTenantTransaction(this.db, input.tenantId, async (tx) => {
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
          "a.customer_id": input.customerId,
          "a.id": input.applicationId,
          "o.status": "ISSUED",
        })
        .orderBy("o.version_number", "desc")
        .first("o.*");
      if (!offer) throw new Error("Current customer loan offer not found");
      const schedule = await tx("loan_offer_schedules")
        .where({ tenant_id: input.tenantId, offer_id: offer.id })
        .first();
      const installments = schedule
        ? await tx("loan_offer_installments")
            .where({ tenant_id: input.tenantId, schedule_id: schedule.id })
            .orderBy("installment_number")
        : [];
      return {
        ...offer,
        schedule: schedule ? { ...schedule, installments } : null,
      };
    });
  }

  listLoans(input: { tenantId: string; customerId: string }) {
    return withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loans")
        .where({ tenant_id: input.tenantId, customer_id: input.customerId })
        .orderBy("created_at", "desc"),
    );
  }

  async quoteRepayment(input: {
    tenantId: string;
    customerId: string;
    loanId: string;
    amountMinor: string;
    currency: "NGN";
    source:
      "WALLET" | "DIRECT_DEBIT" | "VIRTUAL_ACCOUNT" | "MANUAL_BANK_TRANSFER";
    idempotencyKey: string;
  }): Promise<RepaymentQuoteResult> {
    const requestHash = hash(input);
    const existing = await withTenantTransaction(
      this.db,
      input.tenantId,
      (tx) =>
        tx("loan_repayment_quotes")
          .where({
            tenant_id: input.tenantId,
            idempotency_key: input.idempotencyKey,
          })
          .first(),
    );
    if (existing) {
      if (existing.request_hash !== requestHash)
        throw new Error(
          "Idempotency key reused with a different repayment quote",
        );
      return wireRepaymentQuote(existing, true);
    }
    const loan = await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loans")
        .where({
          tenant_id: input.tenantId,
          customer_id: input.customerId,
          id: input.loanId,
          currency: "NGN",
        })
        .whereIn("status", ["ACTIVE", "OVERDUE"])
        .first(),
    );
    if (!loan) throw new Error("Repayable customer loan not found");
    const snapshot = {
      penalty_minor: loan.outstanding_penalties,
      fees_minor: loan.outstanding_fees,
      interest_minor: loan.outstanding_interest,
      principal_minor: loan.outstanding_principal,
    };
    let remaining = BigInt(input.amountMinor);
    const preview: Record<string, string> = {};
    for (const component of [
      "penalty",
      "fees",
      "interest",
      "principal",
    ] as const) {
      const due = BigInt(snapshot[`${component}_minor`]);
      const allocated = remaining < due ? remaining : due;
      preview[`${component}_minor`] = allocated.toString();
      remaining -= allocated;
    }
    preview.unapplied_minor = remaining.toString();
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
    const row = {
      id,
      tenant_id: input.tenantId,
      customer_id: input.customerId,
      loan_id: input.loanId,
      amount: input.amountMinor,
      currency: "NGN",
      source: input.source,
      outstanding_snapshot: JSON.stringify(snapshot),
      allocation_preview: JSON.stringify(preview),
      calculation_input_hash: hash(snapshot),
      calculation_output_hash: hash(preview),
      idempotency_key: input.idempotencyKey,
      request_hash: requestHash,
      expires_at: expiresAt,
    };
    await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loan_repayment_quotes").insert(row),
    );
    return wireRepaymentQuote(row, false);
  }

  async requestRepayment(input: {
    tenantId: string;
    customerId: string;
    loanId: string;
    repaymentQuoteId: string;
    authorizationToken?: string;
    collectionReference?: string;
    idempotencyKey: string;
    correlationId: string;
  }): Promise<RepaymentRequestResult> {
    const quote = await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loan_repayment_quotes")
        .where({
          tenant_id: input.tenantId,
          id: input.repaymentQuoteId,
          loan_id: input.loanId,
          customer_id: input.customerId,
        })
        .first(),
    );
    if (!quote || new Date(quote.expires_at).getTime() <= Date.now())
      throw new Error("Current customer repayment quote not found");
    if (
      ["WALLET", "DIRECT_DEBIT"].includes(quote.source) &&
      !input.authorizationToken
    )
      throw new Error("Transaction authorization is required for this source");
    if (
      ["VIRTUAL_ACCOUNT", "MANUAL_BANK_TRANSFER"].includes(quote.source) &&
      !input.collectionReference
    )
      throw new Error("Collection reference is required for this source");
    const authorization = input.authorizationToken
      ? await this.authorizations.verify({
          tenantId: input.tenantId,
          customerId: input.customerId,
          action: "CREATE_LOAN_REPAYMENT",
          resourceId: input.repaymentQuoteId,
          token: input.authorizationToken,
        })
      : undefined;
    if (authorization && authorization.customerId !== input.customerId)
      throw new Error("Authorization customer mismatch");
    const requestHash = hash({
      loanId: input.loanId,
      repaymentQuoteId: input.repaymentQuoteId,
      authorizationReference: authorization?.reference,
      collectionReference: input.collectionReference,
    });
    const existing = await withTenantTransaction(
      this.db,
      input.tenantId,
      (tx) =>
        tx("loan_repayment_requests")
          .where({
            tenant_id: input.tenantId,
            idempotency_key: input.idempotencyKey,
          })
          .first(),
    );
    if (existing) {
      if (existing.request_hash !== requestHash)
        throw new Error(
          "Idempotency key reused with a different repayment request",
        );
      return {
        id: existing.id,
        status: existing.status,
        paymentRequestId: existing.payment_request_id ?? null,
        replayed: true,
      };
    }
    const id = randomUUID();
    await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loan_repayment_requests").insert({
        id,
        tenant_id: input.tenantId,
        customer_id: input.customerId,
        loan_id: input.loanId,
        repayment_quote_id: input.repaymentQuoteId,
        status: "SUBMITTING",
        authorization_reference: authorization?.reference,
        authorization_evidence_hash: input.authorizationToken
          ? createHash("sha256").update(input.authorizationToken).digest("hex")
          : undefined,
        collection_reference: input.collectionReference,
        payment_correlation_id: input.correlationId,
        idempotency_key: input.idempotencyKey,
        request_hash: requestHash,
      }),
    );
    const payment = await this.payments.initiate({
      tenantId: input.tenantId,
      customerId: input.customerId,
      loanId: input.loanId,
      repaymentRequestId: id,
      amountMinor: quote.amount,
      currency: "NGN",
      source: quote.source,
      ...(input.collectionReference
        ? { collectionReference: input.collectionReference }
        : {}),
      idempotencyKey: `loan-repayment:${id}`,
      correlationId: input.correlationId,
    });
    await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loan_repayment_requests")
        .where({ tenant_id: input.tenantId, id })
        .update({
          status: payment.status,
          payment_request_id: payment.paymentRequestId,
          updated_at: tx.fn.now(),
        }),
    );
    return {
      id,
      status: payment.status,
      paymentRequestId: payment.paymentRequestId,
      replayed: false,
    };
  }
}

function parseFees(value: unknown): Array<{
  code: string;
  description: string;
  amountMinor: string;
  treatment: "FINANCED" | "DEDUCTED_FROM_DISBURSEMENT";
}> {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) return [];
  return parsed.map((fee: Record<string, unknown>) => ({
    code: String(fee.code),
    description: String(fee.description),
    amountMinor: String(fee.amount_minor ?? fee.amountMinor),
    treatment: fee.treatment as "FINANCED" | "DEDUCTED_FROM_DISBURSEMENT",
  }));
}
function wireLoanQuote(row: Record<string, any>, replayed: boolean) {
  return {
    id: row.id,
    amountMinor: String(row.amount),
    currency: row.currency,
    totalInterestMinor: String(row.total_interest),
    totalFeesMinor: String(row.total_fees),
    totalRepayableMinor: String(row.total_repayable),
    maturityDate: row.maturity_date,
    schedule:
      typeof row.schedule === "string"
        ? JSON.parse(row.schedule)
        : row.schedule,
    expiresAt: row.expires_at,
    replayed,
  };
}
function wireRepaymentQuote(row: Record<string, any>, replayed: boolean) {
  return {
    id: row.id,
    loanId: row.loan_id,
    amountMinor: String(row.amount),
    currency: row.currency,
    source: row.source,
    allocationPreview:
      typeof row.allocation_preview === "string"
        ? JSON.parse(row.allocation_preview)
        : row.allocation_preview,
    expiresAt: row.expires_at,
    replayed,
  };
}
function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

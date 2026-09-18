import { createHash, randomUUID } from "node:crypto";
import type { Knex } from "knex";
import { withTenantTransaction } from "../database/client.js";
import type { LendingApprovalGateway } from "./approval-gateway.js";

export type LoanProductType =
  | "UNSECURED_PERSONAL"
  | "INSTANT"
  | "SALARY_BACKED"
  | "BUSINESS"
  | "SECURED"
  | "ASSET_FINANCE";
export interface VersionTerms {
  currency: string;
  minAmountMinor: string;
  maxAmountMinor: string;
  minTenureDays: number;
  maxTenureDays: number;
  annualRate: string;
  interestType: "FLAT" | "REDUCING_BALANCE" | "DAILY_REDUCING_BALANCE";
  interestPaymentMethod: "UPFRONT" | "AMORTIZED" | "AT_MATURITY";
  repaymentFrequency:
    "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "BULLET";
  repaymentGracePeriodDays: number;
  latePaymentGracePeriodDays: number;
  allocationOrder: Array<"PENALTY" | "FEES" | "INTEREST" | "PRINCIPAL">;
  dayCountConvention?:
    "ACTUAL_365" | "ACTUAL_360" | "THIRTY_360" | "ACTUAL_ACTUAL";
  penalty?: {
    type: "FIXED" | "PERCENTAGE";
    rate?: string;
    fixedAmountMinor?: string;
    capAmountMinor?: string;
    frequency: "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY";
    compounds?: boolean;
  };
  autoApprovalEnabled?: boolean;
  dailyReducingEnabled?: boolean;
  readiness?: {
    collateralValuation: boolean;
    insurance: boolean;
    vendorPayment: boolean;
    repossession: boolean;
    legalProcess: boolean;
  };
  delinquencyBuckets?: Array<{ code: string; minimumDpd: number }>;
  writeoffEligibility?: { minimumDpd: number };
  configuration?: Record<string, unknown>;
}

export class LoanProductService {
  constructor(
    private readonly db: Knex,
    private readonly approvals: LendingApprovalGateway,
  ) {}
  async createProduct(input: {
    tenantId: string;
    code: string;
    name: string;
    type: LoanProductType;
    description?: string;
    idempotencyKey: string;
  }): Promise<{ id: string; replayed: boolean }> {
    const requestHash = hash({
      code: input.code,
      name: input.name,
      type: input.type,
      description: input.description ?? null,
    });
    return withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const existing = await tx("loan_products")
        .where({
          tenant_id: input.tenantId,
          idempotency_key: input.idempotencyKey,
        })
        .first<{ id: string; request_hash: string }>();
      if (existing) {
        if (existing.request_hash !== requestHash)
          throw new Error("Idempotency key reused with different product");
        return { id: existing.id, replayed: true };
      }
      const id = randomUUID();
      await tx("loan_products").insert({
        id,
        tenant_id: input.tenantId,
        product_code: input.code,
        product_name: input.name,
        product_type: input.type,
        description: input.description,
        currency: "NGN",
        lifecycle_status: "DRAFT",
        is_active: false,
        idempotency_key: input.idempotencyKey,
        request_hash: requestHash,
      });
      return { id, replayed: false };
    });
  }
  async createVersion(input: {
    tenantId: string;
    productId: string;
    terms: VersionTerms;
    effectiveFrom: string;
    idempotencyKey: string;
  }): Promise<{ id: string; version: number; replayed: boolean }> {
    validateTerms(input.terms);
    const requestHash = hash({
      productId: input.productId,
      terms: input.terms,
      effectiveFrom: input.effectiveFrom,
    });
    return withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const existing = await tx("loan_product_versions")
        .where({
          tenant_id: input.tenantId,
          idempotency_key: input.idempotencyKey,
        })
        .first<{ id: string; version_number: number; request_hash: string }>();
      if (existing) {
        if (existing.request_hash !== requestHash)
          throw new Error("Idempotency key reused with different version");
        return {
          id: existing.id,
          version: existing.version_number,
          replayed: true,
        };
      }
      const product = await tx("loan_products")
        .where({ tenant_id: input.tenantId, id: input.productId })
        .forUpdate()
        .first<{
          product_code: string;
          product_name: string;
          product_type: LoanProductType;
        }>();
      if (!product) throw new Error("Loan product not found");
      const latest = await tx("loan_product_versions")
        .where({ tenant_id: input.tenantId, loan_product_id: input.productId })
        .max<{ max: string | null }>("version_number as max")
        .first();
      const version = Number(latest?.max ?? 0) + 1;
      const id = randomUUID();
      const readiness = input.terms.readiness;
      const configurationHash = hash({ terms: input.terms, version });
      await tx("loan_product_versions").insert({
        id,
        tenant_id: input.tenantId,
        loan_product_id: input.productId,
        version_number: version,
        product_code: product.product_code,
        product_name: product.product_name,
        product_type: product.product_type,
        currency: input.terms.currency,
        min_amount: input.terms.minAmountMinor,
        max_amount: input.terms.maxAmountMinor,
        min_tenure_days: input.terms.minTenureDays,
        max_tenure_days: input.terms.maxTenureDays,
        interest_rate: input.terms.annualRate,
        interest_rate_period: "ANNUAL",
        interest_type: input.terms.interestType,
        interest_payment_method: input.terms.interestPaymentMethod,
        repayment_frequency: input.terms.repaymentFrequency,
        grace_period_days: input.terms.repaymentGracePeriodDays,
        repayment_grace_period_days: input.terms.repaymentGracePeriodDays,
        late_payment_grace_period_days: input.terms.latePaymentGracePeriodDays,
        day_count_convention: input.terms.dayCountConvention ?? "ACTUAL_365",
        repayment_allocation_order: JSON.stringify(input.terms.allocationOrder),
        requires_collateral: ["SECURED", "ASSET_FINANCE"].includes(
          product.product_type,
        ),
        requires_salary_verification: product.product_type === "SALARY_BACKED",
        auto_approval_enabled: input.terms.autoApprovalEnabled ?? false,
        product_configuration: JSON.stringify(input.terms.configuration ?? {}),
        tier_snapshot: "[]",
        fee_snapshot: "[]",
        rule_snapshot: "[]",
        effective_from: input.effectiveFrom,
        is_current: false,
        published_at: null,
        status: "DRAFT",
        idempotency_key: input.idempotencyKey,
        request_hash: requestHash,
        configuration_hash: configurationHash,
        penalty_type: input.terms.penalty?.type,
        penalty_rate: input.terms.penalty?.rate,
        penalty_fixed_amount: input.terms.penalty?.fixedAmountMinor,
        penalty_cap_amount: input.terms.penalty?.capAmountMinor,
        penalty_frequency: input.terms.penalty?.frequency,
        penalty_compounds: input.terms.penalty?.compounds ?? false,
        daily_reducing_enabled: input.terms.dailyReducingEnabled ?? false,
        collateral_valuation_ready: readiness?.collateralValuation ?? false,
        insurance_ready: readiness?.insurance ?? false,
        vendor_payment_ready: readiness?.vendorPayment ?? false,
        repossession_ready: readiness?.repossession ?? false,
        legal_process_ready: readiness?.legalProcess ?? false,
        activated_for_tenant: [
          "UNSECURED_PERSONAL",
          "INSTANT",
          "SALARY_BACKED",
          "BUSINESS",
        ].includes(product.product_type),
        delinquency_buckets: JSON.stringify(
          (
            input.terms.delinquencyBuckets ?? [
              { code: "CURRENT", minimumDpd: 0 },
              { code: "WATCH", minimumDpd: 1 },
              { code: "DELINQUENT", minimumDpd: 30 },
              { code: "DEFAULT", minimumDpd: 90 },
            ]
          ).map((bucket) => ({
            code: bucket.code,
            minimum_dpd: bucket.minimumDpd,
          })),
        ),
        writeoff_eligibility: JSON.stringify({
          minimum_dpd: input.terms.writeoffEligibility?.minimumDpd ?? 90,
        }),
      });
      return { id, version, replayed: false };
    });
  }
  async publish(input: {
    tenantId: string;
    productId: string;
    versionId: string;
    approvalId: string;
    publisherId: string;
    idempotencyKey: string;
    correlationId: string;
  }): Promise<{ id: string; status: "PUBLISHED"; replayed: boolean }> {
    const row = await withTenantTransaction(this.db, input.tenantId, (tx) =>
      tx("loan_product_versions")
        .where({
          tenant_id: input.tenantId,
          id: input.versionId,
          loan_product_id: input.productId,
        })
        .first<{ id: string; status: string; configuration_hash: string }>(),
    );
    if (!row) throw new Error("Product version not found");
    if (row.status === "PUBLISHED")
      return { id: row.id, status: "PUBLISHED", replayed: true };
    if (row.status !== "DRAFT" && row.status !== "PENDING_APPROVAL")
      throw new Error("Product version cannot be published");
    const payloadHash = publicationPayloadHash({
      tenantId: input.tenantId,
      productId: input.productId,
      versionId: input.versionId,
      configurationHash: row.configuration_hash,
    });
    await this.approvals.consume({
      tenantId: input.tenantId,
      approvalId: input.approvalId,
      action: "PRODUCT_PUBLICATION",
      resourceType: "loan_product_version",
      resourceId: input.versionId,
      payloadHash,
      idempotencyKey: `publish:${input.idempotencyKey}:approval`,
      correlationId: input.correlationId,
    });
    await withTenantTransaction(this.db, input.tenantId, async (tx) => {
      const now = tx.fn.now();
      await tx("loan_product_versions")
        .where({
          tenant_id: input.tenantId,
          loan_product_id: input.productId,
          status: "PUBLISHED",
          is_current: true,
        })
        .update({ status: "RETIRED", is_current: false, effective_to: now });
      await tx("loan_product_versions")
        .where({ tenant_id: input.tenantId, id: input.versionId })
        .update({
          status: "PUBLISHED",
          is_current: true,
          approval_id: input.approvalId,
          published_by: input.publisherId,
          published_at: now,
        });
      await tx("loan_products")
        .where({ tenant_id: input.tenantId, id: input.productId })
        .update({ lifecycle_status: "ACTIVE", is_active: true });
      await tx("loan_outbox_events").insert({
        tenant_id: input.tenantId,
        aggregate_type: "loan_product_version",
        aggregate_id: input.versionId,
        event_type: "loan.product-version-published.v1",
        event_version: 1,
        idempotency_key: `product-version:${input.versionId}:published`,
        correlation_id: input.correlationId,
        payload: {
          product_id: input.productId,
          product_version_id: input.versionId,
          configuration_hash: row.configuration_hash,
        },
      });
    });
    return { id: input.versionId, status: "PUBLISHED", replayed: false };
  }
}
export function publicationPayloadHash(input: {
  tenantId: string;
  productId: string;
  versionId: string;
  configurationHash: string;
}): string {
  return hash(input);
}
function validateTerms(t: VersionTerms): void {
  if (t.currency !== "NGN")
    throw new Error("Only NGN publication is operationally enabled");
  for (const value of [t.minAmountMinor, t.maxAmountMinor])
    if (!/^[1-9]\d*$/.test(value))
      throw new Error("Amounts must be positive minor-unit strings");
  if (BigInt(t.maxAmountMinor) < BigInt(t.minAmountMinor))
    throw new Error("Invalid amount range");
  if (!/^(0|[1-9]\d*)(\.\d{1,10})?$/.test(t.annualRate))
    throw new Error("Rate must have at most 10 decimal places");
  if (
    new Set(t.allocationOrder).size !== 4 ||
    !["PENALTY", "FEES", "INTEREST", "PRINCIPAL"].every((v) =>
      t.allocationOrder.includes(v as VersionTerms["allocationOrder"][number]),
    )
  )
    throw new Error("Allocation order must contain each component once");
  if (t.interestType === "DAILY_REDUCING_BALANCE" && !t.dailyReducingEnabled)
    throw new Error("Daily reducing balance is disabled");
  if (t.penalty?.compounds === true)
    throw new Error(
      "Compounding penalties require a later explicit policy enablement",
    );
  if (t.delinquencyBuckets) {
    if (
      t.delinquencyBuckets.length === 0 ||
      !t.delinquencyBuckets.some((bucket) => bucket.minimumDpd === 0) ||
      new Set(t.delinquencyBuckets.map((bucket) => bucket.code)).size !==
        t.delinquencyBuckets.length ||
      new Set(t.delinquencyBuckets.map((bucket) => bucket.minimumDpd)).size !==
        t.delinquencyBuckets.length ||
      t.delinquencyBuckets.some(
        (bucket) => !bucket.code.trim() || bucket.minimumDpd < 0,
      )
    )
      throw new Error(
        "Delinquency buckets require unique codes and thresholds including zero DPD",
      );
  }
  if (
    t.writeoffEligibility &&
    (!Number.isInteger(t.writeoffEligibility.minimumDpd) ||
      t.writeoffEligibility.minimumDpd < 0)
  )
    throw new Error("Write-off minimum DPD must be a non-negative integer");
}
function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

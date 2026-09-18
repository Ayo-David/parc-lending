import { randomUUID } from "node:crypto";
import knex, { type Knex } from "knex";
import {
  LoanProductService,
  publicationPayloadHash,
  type VersionTerms,
} from "../../src/services/loan-product-service.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
describeDatabase("LN-01 loan product versions", () => {
  let db: Knex;
  const tenantId = randomUUID();
  const publisherId = randomUUID();
  const approvalId = randomUUID();
  beforeAll(() => {
    db = knex({ client: "pg", connection: databaseUrl! });
  });
  afterAll(async () => {
    await db.raw(
      "ALTER TABLE public.loan_product_version_history DISABLE TRIGGER trg_protect_product_version_history",
    );
    await db("loan_product_version_history")
      .where({ tenant_id: tenantId })
      .delete();
    await db.raw(
      "ALTER TABLE public.loan_product_version_history ENABLE TRIGGER trg_protect_product_version_history",
    );
    await db("loan_outbox_events").where({ tenant_id: tenantId }).delete();
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
  const terms: VersionTerms = {
    currency: "NGN",
    minAmountMinor: "500000",
    maxAmountMinor: "50000000",
    minTenureDays: 30,
    maxTenureDays: 365,
    annualRate: "24.0000000000",
    interestType: "REDUCING_BALANCE",
    interestPaymentMethod: "AMORTIZED",
    repaymentFrequency: "MONTHLY",
    repaymentGracePeriodDays: 3,
    latePaymentGracePeriodDays: 5,
    allocationOrder: ["PENALTY", "FEES", "INTEREST", "PRINCIPAL"],
    penalty: {
      type: "PERCENTAGE",
      rate: "1.5000000000",
      capAmountMinor: "500000",
      frequency: "MONTHLY",
    },
    delinquencyBuckets: [
      { code: "CURRENT", minimumDpd: 0 },
      { code: "WATCH", minimumDpd: 7 },
      { code: "DEFAULT", minimumDpd: 60 },
    ],
    writeoffEligibility: { minimumDpd: 120 },
  };
  it("creates an idempotent draft and publishes only with an exact approval", async () => {
    let consumedHash = "";
    const service = new LoanProductService(db, {
      consume: (input) => {
        expect(input.approvalId).toBe(approvalId);
        consumedHash = input.payloadHash;
        return Promise.resolve({ approvalId, replayed: false });
      },
    });
    const product = await service.createProduct({
      tenantId,
      code: `PERSONAL-${tenantId.slice(0, 8)}`,
      name: "Personal Loan",
      type: "UNSECURED_PERSONAL",
      idempotencyKey: "product-1",
    });
    expect(
      (
        await service.createProduct({
          tenantId,
          code: `PERSONAL-${tenantId.slice(0, 8)}`,
          name: "Personal Loan",
          type: "UNSECURED_PERSONAL",
          idempotencyKey: "product-1",
        })
      ).replayed,
    ).toBe(true);
    const version = await service.createVersion({
      tenantId,
      productId: product.id,
      terms,
      effectiveFrom: new Date().toISOString(),
      idempotencyKey: "version-1",
    });
    const stored = await db("loan_product_versions")
      .where({ id: version.id })
      .first<{
        configuration_hash: string;
        status: string;
        delinquency_buckets: Array<{ code: string; minimum_dpd: number }>;
        writeoff_eligibility: { minimum_dpd: number };
      }>();
    expect(stored?.status).toBe("DRAFT");
    expect(stored?.delinquency_buckets).toEqual([
      { code: "CURRENT", minimum_dpd: 0 },
      { code: "WATCH", minimum_dpd: 7 },
      { code: "DEFAULT", minimum_dpd: 60 },
    ]);
    expect(stored?.writeoff_eligibility).toEqual({ minimum_dpd: 120 });
    if (!stored) throw new Error("Expected stored product version");
    const result = await service.publish({
      tenantId,
      productId: product.id,
      versionId: version.id,
      approvalId,
      publisherId,
      idempotencyKey: "publish-1",
      correlationId: randomUUID(),
    });
    expect(result.status).toBe("PUBLISHED");
    expect(consumedHash).toBe(
      publicationPayloadHash({
        tenantId,
        productId: product.id,
        versionId: version.id,
        configurationHash: stored.configuration_hash,
      }),
    );
    expect(
      await db("loan_outbox_events")
        .where({
          tenant_id: tenantId,
          event_type: "loan.product-version-published.v1",
        })
        .count<{ count: string }>("*")
        .first(),
    ).toEqual({ count: "1" });
    await expect(
      db("loan_product_versions")
        .where({ id: version.id })
        .update({ interest_rate: "1" }),
    ).rejects.toThrow(/immutable/);
  });
  it("rejects disabled daily reducing-balance configuration", async () => {
    const service = new LoanProductService(db, {
      consume: () => Promise.resolve({ approvalId, replayed: false }),
    });
    const product = await service.createProduct({
      tenantId,
      code: `INSTANT-${tenantId.slice(0, 8)}`,
      name: "Instant",
      type: "INSTANT",
      idempotencyKey: "product-2",
    });
    await expect(
      service.createVersion({
        tenantId,
        productId: product.id,
        terms: {
          ...terms,
          interestType: "DAILY_REDUCING_BALANCE",
          dailyReducingEnabled: false,
        },
        effectiveFrom: new Date().toISOString(),
        idempotencyKey: "version-2",
      }),
    ).rejects.toThrow(/disabled/);
  });
});

import knex from "knex";
import { z } from "zod";
import { LoanApplicationService } from "../src/services/loan-application-service.js";
import { LoanProductService } from "../src/services/loan-product-service.js";

const config = z
  .object({
    NODE_ENV: z.enum(["development", "test"]),
    DATABASE_URL: z.string().url(),
    PR01_TENANT_A_ID: z.string().uuid(),
    PR01_TENANT_B_ID: z.string().uuid(),
    PR01_CUSTOMER_A_ID: z.string().uuid(),
    PR01_CUSTOMER_B_ID: z.string().uuid(),
  })
  .parse(process.env);

const database = knex({ client: "pg", connection: config.DATABASE_URL });
const fixtures = [
  {
    tenantId: config.PR01_TENANT_A_ID,
    customerId: config.PR01_CUSTOMER_A_ID,
    approvalId: "11111111-1111-4111-8111-111111111141",
    publisherId: "11111111-1111-4111-8111-111111111142",
    correlationId: "11111111-1111-4111-8111-111111111143",
    code: "PR01_PERSONAL_A",
  },
  {
    tenantId: config.PR01_TENANT_B_ID,
    customerId: config.PR01_CUSTOMER_B_ID,
    approvalId: "22222222-2222-4222-8222-222222222241",
    publisherId: "22222222-2222-4222-8222-222222222242",
    correlationId: "22222222-2222-4222-8222-222222222243",
    code: "PR01_PERSONAL_B",
  },
] as const;

try {
  const products = new LoanProductService(database, {
    consume: (input) =>
      Promise.resolve({ approvalId: input.approvalId, replayed: false }),
  });
  const applications = new LoanApplicationService(database);
  const output = [];

  for (const fixture of fixtures) {
    const product = await products.createProduct({
      tenantId: fixture.tenantId,
      code: fixture.code,
      name: "PR-01 Unsecured Personal Loan",
      type: "UNSECURED_PERSONAL",
      description: "Disposable load and resilience fixture",
      idempotencyKey: "pr01-personal-product-v1",
    });
    const version = await products.createVersion({
      tenantId: fixture.tenantId,
      productId: product.id,
      effectiveFrom: "2026-01-01T00:00:00.000Z",
      idempotencyKey: "pr01-personal-product-version-v1",
      terms: {
        currency: "NGN",
        minAmountMinor: "100000",
        maxAmountMinor: "50000000",
        minTenureDays: 30,
        maxTenureDays: 365,
        annualRate: "24.0000000000",
        interestType: "REDUCING_BALANCE",
        interestPaymentMethod: "AMORTIZED",
        repaymentFrequency: "MONTHLY",
        repaymentGracePeriodDays: 3,
        latePaymentGracePeriodDays: 3,
        allocationOrder: ["PENALTY", "FEES", "INTEREST", "PRINCIPAL"],
        penalty: {
          type: "PERCENTAGE",
          rate: "1.0000000000",
          capAmountMinor: "500000",
          frequency: "MONTHLY",
          compounds: false,
        },
        autoApprovalEnabled: true,
        dailyReducingEnabled: false,
        configuration: {
          fixture: "PR-01",
          disposable: true,
          underwriting: {
            version: "PR01_POLICY_V1",
            modelVersion: "PR01_RULES_V1",
            minimumKycTier: "TIER_1",
            maxActiveLoans: 1,
            maxTotalExposureToMonthlyIncomeRate: "0.5000000000",
          },
        },
      },
    });

    await products.publish({
      tenantId: fixture.tenantId,
      productId: product.id,
      versionId: version.id,
      approvalId: fixture.approvalId,
      publisherId: fixture.publisherId,
      idempotencyKey: "pr01-personal-product-publication-v1",
      correlationId: fixture.correlationId,
    });

    const application = await applications.submit({
      tenantId: fixture.tenantId,
      customerId: fixture.customerId,
      productVersionId: version.id,
      amountMinor: "5000000",
      tenureDays: 180,
      purpose: "PR-01 load fixture application",
      consentReference: fixture.correlationId,
      declaredMonthlyIncomeMinor: "0",
      idempotencyKey: "pr01-personal-application-v1",
      correlationId: fixture.correlationId,
    });
    output.push({
      tenantId: fixture.tenantId,
      customerId: fixture.customerId,
      productId: product.id,
      productVersionId: version.id,
      productStatus: "PUBLISHED",
      applicationId: application.id,
      applicationStatus: application.status,
      requestedAmountMinor: "5000000",
      currency: "NGN",
    });
  }

  console.log(JSON.stringify({ fixture: "PR-01", lending: output }));
} finally {
  await database.destroy();
}

import { randomUUID } from "node:crypto";
import knex, { type Knex } from "knex";
import request from "supertest";
import { createApp, type LendingCommandHandlers } from "../../src/app.js";
import { LoanProductService } from "../../src/services/loan-product-service.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
const integrationTest = databaseUrl ? test : test.skip;
let database: Knex;

beforeAll(() => {
  database = knex({
    client: "pg",
    connection: databaseUrl ?? "postgresql:///unused",
  });
});
afterAll(async () => database.destroy());

integrationTest(
  "runs an authenticated product command from HTTP through service and PostgreSQL",
  async () => {
    const tenantId = randomUUID();
    const product = new LoanProductService(database, {
      consume: () =>
        Promise.resolve({ approvalId: randomUUID(), replayed: false }),
    });
    const unavailable = () => Promise.reject(new Error("unused handler"));
    const handlers = Object.fromEntries(
      [
        "createProductVersion",
        "publishProduct",
        "submitApplication",
        "evaluateApplication",
        "openManualReview",
        "assignManualReview",
        "recommendManualDecision",
        "decideApplicationManually",
        "issueOffer",
        "acceptOffer",
        "listCustomerProducts",
        "quoteCustomerLoan",
        "getCustomerApplication",
        "getCustomerOffer",
        "listCustomerLoans",
        "quoteCustomerRepayment",
        "requestCustomerRepayment",
        "disburse",
        "recordRepayment",
        "restructure",
        "writeOff",
        "postWriteOffRecovery",
        "reverseRepayment",
      ].map((name) => [name, unavailable]),
    ) as unknown as LendingCommandHandlers;
    handlers.createProduct = (input) =>
      product.createProduct(
        input as Parameters<LoanProductService["createProduct"]>[0],
      );
    let readyChecks = 0;
    const app = createApp(
      handlers,
      {
        authenticate: () =>
          Promise.resolve({ tenantId, subjectId: randomUUID() }),
      },
      async () => {
        readyChecks += 1;
        await database.raw("SELECT 1");
      },
    );
    await request(app).get("/ready").expect(200, { status: "ready" });
    const idempotencyKey = randomUUID();
    const command = {
      code: `PERSONAL-${randomUUID()}`,
      name: "Personal loan",
      loan_type: "UNSECURED_PERSONAL",
    };
    const created = await request(app)
      .post("/v1/loan-products")
      .set("Authorization", "Bearer synthetic")
      .set("X-Tenant-Id", tenantId)
      .set("Idempotency-Key", idempotencyKey)
      .send(command)
      .expect(201);
    const replayed = await request(app)
      .post("/v1/loan-products")
      .set("Authorization", "Bearer synthetic")
      .set("X-Tenant-Id", tenantId)
      .set("Idempotency-Key", idempotencyKey)
      .send(command)
      .expect(201);
    expect(created.body).toMatchObject({ replayed: false });
    expect(replayed.body).toEqual({ ...created.body, replayed: true });
    expect(readyChecks).toBe(1);
  },
);

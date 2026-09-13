import { z } from "zod";
/* eslint-disable @typescript-eslint/unbound-method -- method references are used only to infer command input types */
import type { LendingCommandHandlers } from "./app.js";
import { createDatabase } from "./database/client.js";
import { FinancialHttpGateways } from "./runtime/financial-http-gateways.js";
import { InternalHttpClient } from "./runtime/internal-http-client.js";
import { JwksLendingAuthenticator } from "./runtime/jwt-authenticator.js";
import { LendingOutboxPublisher } from "./runtime/outbox-publisher.js";
import { startServer } from "./server.js";
import { CustomerLendingService } from "./services/customer-lending-service.js";
import { LoanApplicationService } from "./services/loan-application-service.js";
import { LoanDisbursementService } from "./services/loan-disbursement-service.js";
import { LoanOfferService } from "./services/loan-offer-service.js";
import { LoanProductService } from "./services/loan-product-service.js";
import { LoanRepaymentReversalService } from "./services/loan-repayment-reversal-service.js";
import { LoanRepaymentService } from "./services/loan-repayment-service.js";
import { LoanResolutionService } from "./services/loan-resolution-service.js";
import { LoanRestructureService } from "./services/loan-restructure-service.js";
import { ManualUnderwritingService } from "./services/manual-underwriting-service.js";

const config = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(3005),
    DATABASE_URL: z.string().default("postgresql:///parc_lending"),
    AUTH_CUSTOMER_URL: z.string().url().default("http://127.0.0.1:3001"),
    AUTH_JWKS_URL: z
      .string()
      .url()
      .default("http://127.0.0.1:3001/.well-known/jwks.json"),
    AUTH_JWT_ISSUER: z.string().url().default("https://auth.parc.invalid"),
    CUSTOMER_JWT_AUDIENCE: z.string().default("mobile-bff"),
    ADMIN_JWT_AUDIENCE: z.string().default("admin-bff"),
    SERVICE_JWT_AUDIENCE: z.string().default("parc-lending"),
    TENANT_ADMIN_URL: z.string().url().default("http://127.0.0.1:3002"),
    LEDGER_URL: z.string().url().default("http://127.0.0.1:3003"),
    PAYMENT_URL: z.string().url().default("http://127.0.0.1:3004"),
    INTERNAL_SERVICE_TOKEN: z.string().min(32),
    RABBITMQ_URL: z.string().url().default("amqp://127.0.0.1:5672"),
    OUTBOX_TENANT_IDS: z.string().default(""),
    OUTBOX_POLL_MS: z.coerce.number().int().min(100).default(1000),
  })
  .refine(
    (value) =>
      value.NODE_ENV !== "production" ||
      value.OUTBOX_TENANT_IDS.trim().length > 0,
    { message: "Production requires OUTBOX_TENANT_IDS" },
  )
  .parse(process.env);

const database = createDatabase(config.DATABASE_URL);
const internal = new InternalHttpClient({
  authCustomerUrl: config.AUTH_CUSTOMER_URL,
  tenantAdminUrl: config.TENANT_ADMIN_URL,
  serviceToken: config.INTERNAL_SERVICE_TOKEN,
});
const financial = new FinancialHttpGateways(
  config.LEDGER_URL,
  config.PAYMENT_URL,
  config.INTERNAL_SERVICE_TOKEN,
);
const product = new LoanProductService(database, internal);
const application = new LoanApplicationService(database);
const manual = new ManualUnderwritingService(database, internal);
const offer = new LoanOfferService(database, internal);
const repaymentLedger = financial.repaymentLedger();
const customer = new CustomerLendingService(
  database,
  internal,
  financial.paymentCollection(),
);
const handlers: LendingCommandHandlers = {
  createProduct: (input) =>
    product.createProduct(asInput(product.createProduct, input)),
  createProductVersion: (input) =>
    product.createVersion(asInput(product.createVersion, input)),
  publishProduct: (input) => product.publish(asInput(product.publish, input)),
  submitApplication: (input) =>
    application.submit(asInput(application.submit, input)),
  evaluateApplication: (input) =>
    application.evaluate(asInput(application.evaluate, input)),
  openManualReview: (input) => manual.open(asInput(manual.open, input)),
  assignManualReview: (input) => manual.assign(asInput(manual.assign, input)),
  recommendManualDecision: (input) =>
    manual.recommend(asInput(manual.recommend, input)),
  decideApplicationManually: (input) =>
    manual.decide(asInput(manual.decide, input)),
  issueOffer: (input) => offer.issue(asInput(offer.issue, input)),
  acceptOffer: (input) => offer.accept(asInput(offer.accept, input)),
  listCustomerProducts: (input) =>
    customer.listProducts(asInput(customer.listProducts, input)),
  quoteCustomerLoan: (input) =>
    customer.quoteLoan(asInput(customer.quoteLoan, input)),
  getCustomerApplication: (input) =>
    customer.getApplication(asInput(customer.getApplication, input)),
  getCustomerOffer: (input) =>
    customer.getOffer(asInput(customer.getOffer, input)),
  listCustomerLoans: (input) =>
    customer.listLoans(asInput(customer.listLoans, input)),
  quoteCustomerRepayment: (input) =>
    customer.quoteRepayment(asInput(customer.quoteRepayment, input)),
  requestCustomerRepayment: (input) =>
    customer.requestRepayment(asInput(customer.requestRepayment, input)),
  disburse: (input) =>
    new LoanDisbursementService(
      database,
      internal,
      financial.disbursementLedger(),
      financial.paymentPayout(),
    ).start(asInput(LoanDisbursementService.prototype.start, input)),
  recordRepayment: (input) =>
    new LoanRepaymentService(
      database,
      repaymentLedger,
    ).allocateConfirmedPayment(
      asInput(LoanRepaymentService.prototype.allocateConfirmedPayment, input),
    ),
  reverseRepayment: (input) =>
    new LoanRepaymentReversalService(database, repaymentLedger).reverse(
      asInput(LoanRepaymentReversalService.prototype.reverse, input),
    ),
  restructure: (input) =>
    new LoanRestructureService(
      database,
      internal,
      financial.restructureLedger(),
    ).restructure(asInput(LoanRestructureService.prototype.restructure, input)),
  writeOff: (input) =>
    new LoanResolutionService(
      database,
      internal,
      financial.resolutionLedger(),
    ).writeOff(asInput(LoanResolutionService.prototype.writeOff, input)),
  postWriteOffRecovery: (input) =>
    new LoanResolutionService(
      database,
      internal,
      financial.resolutionLedger(),
    ).postWriteOffRecovery(
      asInput(LoanResolutionService.prototype.postWriteOffRecovery, input),
    ),
};

const authenticator = new JwksLendingAuthenticator(
  config.AUTH_JWKS_URL,
  config.AUTH_JWT_ISSUER,
  {
    CUSTOMER: config.CUSTOMER_JWT_AUDIENCE,
    ADMIN: config.ADMIN_JWT_AUDIENCE,
    SERVICE: config.SERVICE_JWT_AUDIENCE,
  },
);
const outbox = new LendingOutboxPublisher(database, config.RABBITMQ_URL);
await outbox.connect();
const tenantIds = config.OUTBOX_TENANT_IDS.split(",")
  .map((value) => value.trim())
  .filter(Boolean)
  .map((value) => z.string().uuid().parse(value));
let publishing = false;
const timer = setInterval(() => {
  if (publishing) return;
  publishing = true;
  void Promise.all(
    tenantIds.map((tenantId) => outbox.publishTenantBatch(tenantId)),
  )
    .catch((error: unknown) =>
      console.error("Lending outbox publish failed", error),
    )
    .finally(() => {
      publishing = false;
    });
}, config.OUTBOX_POLL_MS);
timer.unref();
const server = startServer(handlers, authenticator, config.PORT, async () => {
  await database.raw("SELECT 1");
});

let stopping = false;
async function shutdown(): Promise<void> {
  if (stopping) return;
  stopping = true;
  clearInterval(timer);
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await outbox.close();
  await database.destroy();
}
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());

function asInput<T extends (input: never) => unknown>(
  method: T,
  input: Record<string, unknown>,
): Parameters<T>[0] {
  void method;
  return input as Parameters<T>[0];
}

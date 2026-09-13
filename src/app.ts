import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import { z } from "zod";

const uuid = z.string().uuid();
const headers = z.object({
  tenantId: uuid,
  idempotencyKey: z.string().min(1).max(255),
});
const loanProduct = z
  .object({
    code: z.string().min(1),
    name: z.string().min(1),
    loan_type: z.enum([
      "UNSECURED_PERSONAL",
      "INSTANT",
      "SALARY_BACKED",
      "BUSINESS",
      "SECURED",
      "ASSET_FINANCE",
    ]),
    description: z.string().max(2000).optional(),
  })
  .strict();
const productVersion = z
  .object({
    interest_method: z.enum([
      "FLAT",
      "REDUCING_BALANCE",
      "DAILY_REDUCING_BALANCE",
    ]),
    interest_payment_method: z.enum(["UPFRONT", "AMORTIZED", "AT_MATURITY"]),
    annual_rate: z.string().regex(/^(0|[1-9][0-9]*)(\.[0-9]{1,10})?$/),
    allocation_order: z
      .array(z.enum(["PENALTY", "FEES", "INTEREST", "PRINCIPAL"]))
      .length(4),
    currency: z.string().regex(/^[A-Z]{3}$/),
    min_amount_minor: z.string().regex(/^[1-9][0-9]*$/),
    max_amount_minor: z.string().regex(/^[1-9][0-9]*$/),
    min_tenure_days: z.number().int().positive(),
    max_tenure_days: z.number().int().positive(),
    repayment_frequency: z.enum([
      "DAILY",
      "WEEKLY",
      "BIWEEKLY",
      "MONTHLY",
      "QUARTERLY",
      "BULLET",
    ]),
    repayment_grace_period_days: z.number().int().nonnegative(),
    late_payment_grace_period_days: z.number().int().nonnegative(),
    effective_from: z.string().datetime(),
    day_count_convention: z
      .enum(["ACTUAL_365", "ACTUAL_360", "THIRTY_360", "ACTUAL_ACTUAL"])
      .optional(),
    daily_reducing_enabled: z.boolean().optional(),
    compounding_penalties: z.boolean().optional(),
    penalty: z
      .object({
        type: z.enum(["FIXED", "PERCENTAGE"]),
        rate: z
          .string()
          .regex(/^(0|[1-9][0-9]*)(\.[0-9]{1,10})?$/)
          .optional(),
        fixed_amount_minor: z
          .string()
          .regex(/^(0|[1-9][0-9]*)$/)
          .optional(),
        cap_amount_minor: z
          .string()
          .regex(/^(0|[1-9][0-9]*)$/)
          .optional(),
        frequency: z.enum(["ONCE", "DAILY", "WEEKLY", "MONTHLY"]),
        compounds: z.boolean().optional(),
      })
      .strict()
      .optional(),
    delinquency_buckets: z
      .array(
        z
          .object({
            code: z.string().min(1).max(50),
            minimum_dpd: z.number().int().nonnegative(),
          })
          .strict(),
      )
      .min(1)
      .optional(),
    writeoff_eligibility: z
      .object({ minimum_dpd: z.number().int().nonnegative() })
      .strict()
      .optional(),
  })
  .strict();
const productPublication = z
  .object({
    approval_id: uuid,
    version_id: uuid,
    publisher_id: uuid,
    correlation_id: uuid,
  })
  .strict();
const underwritingEvidence = z
  .object({
    kyc_tier: z.enum(["TIER_1", "TIER_2", "TIER_3"]),
    kyc_status: z.enum(["VERIFIED", "PENDING", "RESTRICTED", "REJECTED"]),
    kyc_verification_reference: z.string().min(1).max(255),
    consent_reference: z.string().min(1).max(255),
    evidence_observed_at: z.string().datetime(),
    evidence_expires_at: z.string().datetime(),
    monthly_income_minor: z.string().regex(/^(0|[1-9][0-9]*)$/),
    existing_exposure_minor: z.string().regex(/^(0|[1-9][0-9]*)$/),
    active_loan_count: z.number().int().nonnegative(),
    fraud_flag: z.boolean(),
  })
  .strict();
const loanApplication = z
  .object({
    product_version_id: uuid,
    amount_minor: z.string().regex(/^[1-9][0-9]*$/),
    currency: z.literal("NGN"),
    tenure_days: z.number().int().positive(),
    purpose: z.string().min(2).max(500),
    underwriting_evidence: underwritingEvidence,
    correlation_id: uuid,
  })
  .strict();
const manualReview = z
  .object({
    required_authority_level: z.number().int().positive(),
    reason_codes: z.array(z.string().min(1).max(100)).min(1),
  })
  .strict();
const manualAssignment = z
  .object({
    expected_lock_version: z.number().int().nonnegative(),
    lease_until: z.string().datetime(),
  })
  .strict();
const manualRecommendation = z
  .object({
    recommendation: z.enum(["APPROVED", "REJECTED", "CONDITIONAL_APPROVAL"]),
    proposed_terms: z
      .object({
        amount_minor: z.string().regex(/^[1-9][0-9]*$/),
        tenure_days: z.number().int().positive(),
        interest_rate: z.string().regex(/^(0|[1-9][0-9]*)(\.[0-9]{1,10})?$/),
        currency: z.literal("NGN"),
      })
      .strict()
      .optional(),
    reason_codes: z.array(z.string().min(1).max(100)).min(1),
    evidence_references: z.array(z.string().min(1).max(255)),
    comments: z.string().max(2000).optional(),
    policy_version: z.string().min(1).max(100),
    conditions: z
      .array(
        z
          .object({
            code: z.string().min(1).max(100),
            description: z.string().min(1).max(1000),
          })
          .strict(),
      )
      .min(1)
      .optional(),
  })
  .strict();
const manualDecision = z
  .object({
    recommendation_id: uuid,
    approval_id: uuid,
    correlation_id: uuid,
  })
  .strict();
const loanOffer = z
  .object({
    effective_date: z.string().date(),
    expires_at: z.string().datetime(),
    document_reference: z.string().min(1).max(500),
    document_hash: z.string().regex(/^[a-f0-9]{64}$/),
    correlation_id: uuid,
  })
  .strict();
const loanOfferAcceptance = z
  .object({
    offer_version: z.number().int().positive(),
    document_hash: z.string().regex(/^[a-f0-9]{64}$/),
    consent_reference: z.string().min(1).max(255),
    transaction_authorization_token: z.string().min(32),
    correlation_id: uuid,
  })
  .strict();
const customerLoanQuote = z
  .object({
    product_version_id: uuid,
    amount_minor: z.string().regex(/^[1-9][0-9]*$/),
    currency: z.literal("NGN"),
    tenor: z.number().int().positive(),
    repayment_frequency: z.enum(["daily", "weekly", "monthly"]),
    purpose: z.string().max(500).optional(),
    employer_name: z.string().max(200).optional(),
    monthly_salary_minor: z
      .string()
      .regex(/^[1-9][0-9]*$/)
      .optional(),
    asset_type: z.string().max(100).optional(),
    asset_value_minor: z
      .string()
      .regex(/^[1-9][0-9]*$/)
      .optional(),
    vendor_id: uuid.optional(),
  })
  .strict();
const repaymentQuote = z
  .object({
    amount_minor: z.string().regex(/^[1-9][0-9]*$/),
    currency: z.literal("NGN"),
    source: z.enum([
      "wallet",
      "direct_debit",
      "virtual_account",
      "manual_bank_transfer",
    ]),
  })
  .strict();
const customerRepayment = z
  .object({
    repayment_quote_id: uuid,
    transaction_authorization_token: z.string().min(32).optional(),
    collection_reference: z.string().max(255).optional(),
    correlation_id: uuid,
  })
  .strict();
const disbursement = z.object({
  destination_reference: z.string().min(1).max(255),
  receivable_ledger_account_id: uuid,
  funding_ledger_account_id: uuid,
  approval_id: uuid,
  executor_id: uuid,
  correlation_id: uuid,
});
const repayment = z.object({
  loan_id: uuid,
  payment_id: uuid,
  source_event_id: uuid,
  source_event_type: z.string().min(1).max(150),
  source_payload_hash: z.string().regex(/^[a-f0-9]{64}$/),
  amount_minor: z.string().regex(/^[1-9][0-9]*$/),
  currency: z.literal("NGN"),
  method: z.enum([
    "BANK_TRANSFER",
    "DIRECT_DEBIT",
    "CARD",
    "WALLET",
    "CASH",
    "PAYMENT_LINK",
    "INTERNAL_ACCOUNT",
  ]),
  correlation_id: uuid,
  causation_id: uuid,
  receivable_ledger_account_id: uuid,
  cash_ledger_account_id: uuid,
  unapplied_credit_ledger_account_id: uuid,
});
const restructure = z.object({
  approval_id: uuid,
  executor_id: uuid,
  reason_code: z.string().min(1).max(100),
  proposed_terms: z.object({
    principal_minor: z.string().regex(/^(0|[1-9][0-9]*)$/),
    annual_rate: z.string().regex(/^(0|[1-9][0-9]*)(\.[0-9]{1,10})?$/),
    tenure_days: z.number().int().positive(),
    effective_date: z.string().date(),
    capitalized_amount_minor: z
      .string()
      .regex(/^(0|[1-9][0-9]*)$/)
      .default("0"),
    capitalization_authorized: z.boolean().default(false),
    principal_reduction_approval_id: uuid.optional(),
  }),
  calculation_policy_version: z.string().min(1).max(50),
  receivable_ledger_account_id: uuid,
  adjustment_ledger_account_id: uuid,
  correlation_id: uuid,
});
const writeOff = z.object({
  approval_id: uuid,
  executor_id: uuid,
  reason_code: z.string().min(1).max(100),
  expense_ledger_account_id: uuid,
  receivable_ledger_account_ids: z.object({
    principal: uuid,
    interest: uuid,
    fees: uuid,
    penalty: uuid,
  }),
  correlation_id: uuid,
});
const writeOffRecovery = z.object({
  loan_id: uuid,
  write_off_id: uuid,
  payment_id: uuid,
  source_event_id: uuid,
  source_payload_hash: z.string().regex(/^[a-f0-9]{64}$/),
  amount_minor: z.string().regex(/^[1-9][0-9]*$/),
  currency: z.literal("NGN"),
  method: repayment.shape.method,
  cash_ledger_account_id: uuid,
  recovery_ledger_account_ids: z.object({
    principal: uuid,
    interest: uuid,
    fees: uuid,
    penalty: uuid,
  }),
  correlation_id: uuid,
  causation_id: uuid,
});
const repaymentReversal = z.object({
  reason: z.string().min(1).max(500),
  authority_type: z.enum(["APPROVAL", "AUTOMATED_RULE"]),
  authority_id: uuid,
  authority_payload_hash: z.string().regex(/^[a-f0-9]{64}$/),
  correlation_id: uuid,
});

export interface LendingCommandHandlers {
  createProduct(input: Record<string, unknown>): Promise<unknown>;
  createProductVersion(input: Record<string, unknown>): Promise<unknown>;
  publishProduct(input: Record<string, unknown>): Promise<unknown>;
  submitApplication(input: Record<string, unknown>): Promise<unknown>;
  evaluateApplication(input: Record<string, unknown>): Promise<unknown>;
  openManualReview(input: Record<string, unknown>): Promise<unknown>;
  assignManualReview(input: Record<string, unknown>): Promise<unknown>;
  recommendManualDecision(input: Record<string, unknown>): Promise<unknown>;
  decideApplicationManually(input: Record<string, unknown>): Promise<unknown>;
  issueOffer(input: Record<string, unknown>): Promise<unknown>;
  acceptOffer(input: Record<string, unknown>): Promise<unknown>;
  listCustomerProducts(input: Record<string, unknown>): Promise<unknown>;
  quoteCustomerLoan(input: Record<string, unknown>): Promise<unknown>;
  getCustomerApplication(input: Record<string, unknown>): Promise<unknown>;
  getCustomerOffer(input: Record<string, unknown>): Promise<unknown>;
  listCustomerLoans(input: Record<string, unknown>): Promise<unknown>;
  quoteCustomerRepayment(input: Record<string, unknown>): Promise<unknown>;
  requestCustomerRepayment(input: Record<string, unknown>): Promise<unknown>;
  disburse(input: Record<string, unknown>): Promise<unknown>;
  recordRepayment(input: Record<string, unknown>): Promise<unknown>;
  restructure(input: Record<string, unknown>): Promise<unknown>;
  writeOff(input: Record<string, unknown>): Promise<unknown>;
  postWriteOffRecovery(input: Record<string, unknown>): Promise<unknown>;
  reverseRepayment(input: Record<string, unknown>): Promise<unknown>;
}

export interface LendingAuthenticator {
  authenticate(input: {
    authorization: string;
    audience: "CUSTOMER" | "ADMIN" | "SERVICE";
  }): Promise<{ tenantId: string; subjectId: string }>;
}

function context(req: Request) {
  return headers.parse({
    tenantId: req.header("x-tenant-id"),
    idempotencyKey: req.header("idempotency-key"),
  });
}

async function customerContext(
  req: Request,
  authenticator: LendingAuthenticator,
  requiresIdempotency: boolean,
) {
  const principal = await authenticate(req, authenticator, "CUSTOMER");
  const tenantId = uuid.parse(req.header("x-tenant-id"));
  assertTenant(principal.tenantId, tenantId);
  return {
    tenantId,
    customerId: principal.subjectId,
    ...(requiresIdempotency
      ? {
          idempotencyKey: z
            .string()
            .min(1)
            .max(255)
            .parse(req.header("idempotency-key")),
        }
      : {}),
  };
}

async function securedContext(
  req: Request,
  authenticator: LendingAuthenticator,
  audience: "ADMIN" | "SERVICE",
) {
  const principal = await authenticate(req, authenticator, audience);
  const requestContext = context(req);
  assertTenant(principal.tenantId, requestContext.tenantId);
  return { ...requestContext, subjectId: principal.subjectId };
}

export function createApp(
  handlers: LendingCommandHandlers,
  authenticator: LendingAuthenticator,
  readiness?: () => Promise<void>,
) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "256kb" }));
  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
  app.get(
    "/ready",
    asyncRoute(async (_req, res) => {
      await readiness?.();
      res.status(200).json({ status: "ready" });
    }),
  );

  app.post(
    "/v1/loan-products",
    asyncRoute(async (req, res) => {
      const command = loanProduct.parse(req.body);
      const secured = await securedContext(req, authenticator, "ADMIN");
      const result = await handlers.createProduct({
        ...secured,
        code: command.code,
        name: command.name,
        type: command.loan_type,
        ...(command.description === undefined
          ? {}
          : { description: command.description }),
      });
      res.status(201).json(result);
    }),
  );
  app.post(
    "/v1/loan-products/:id/versions",
    asyncRoute(async (req, res) => {
      const command = productVersion.parse(req.body);
      const secured = await securedContext(req, authenticator, "ADMIN");
      const { effective_from: effectiveFrom, ...rawTerms } = command;
      const mapped = camel(rawTerms);
      const { interestMethod, ...terms } = mapped;
      const result = await handlers.createProductVersion({
        ...secured,
        productId: uuid.parse(req.params.id),
        effectiveFrom,
        terms: { ...terms, interestType: interestMethod },
      });
      res.status(201).json(result);
    }),
  );
  app.post(
    "/v1/loan-products/:id/publish",
    asyncRoute(async (req, res) => {
      const command = productPublication.parse(req.body);
      const secured = await securedContext(req, authenticator, "ADMIN");
      const result = await handlers.publishProduct({
        ...secured,
        productId: uuid.parse(req.params.id),
        ...camel(command),
      });
      res.status(200).json(result);
    }),
  );
  app.post(
    "/v1/loan-applications",
    asyncRoute(async (req, res) => {
      const command = loanApplication.parse(req.body);
      const principal = await authenticate(req, authenticator, "CUSTOMER");
      const requestContext = context(req);
      assertTenant(principal.tenantId, requestContext.tenantId);
      const mapped = camel(command);
      const {
        underwritingEvidence: evidence,
        currency: _currency,
        ...input
      } = mapped;
      void _currency;
      const result = await handlers.submitApplication({
        ...requestContext,
        customerId: principal.subjectId,
        ...input,
        evidence,
      });
      res.status(202).json(result);
    }),
  );
  app.post(
    "/internal/v1/applications/:id/evaluate",
    asyncRoute(async (req, res) => {
      const evidence = underwritingEvidence.parse(req.body);
      const principal = await authenticate(req, authenticator, "SERVICE");
      const requestContext = context(req);
      assertTenant(principal.tenantId, requestContext.tenantId);
      const result = await handlers.evaluateApplication({
        ...requestContext,
        applicationId: uuid.parse(req.params.id),
        evidence: camel(evidence),
      });
      res.status(200).json(result);
    }),
  );
  app.post(
    "/v1/applications/:id/manual-reviews",
    asyncRoute(async (req, res) => {
      const command = manualReview.parse(req.body);
      const principal = await authenticate(req, authenticator, "ADMIN");
      const requestContext = context(req);
      assertTenant(principal.tenantId, requestContext.tenantId);
      const result = await handlers.openManualReview({
        ...requestContext,
        applicationId: uuid.parse(req.params.id),
        ...camel(command),
      });
      res.status(201).json(result);
    }),
  );
  app.post(
    "/v1/manual-reviews/:id/assign",
    asyncRoute(async (req, res) => {
      const command = manualAssignment.parse(req.body);
      const principal = await authenticate(req, authenticator, "ADMIN");
      const requestContext = context(req);
      assertTenant(principal.tenantId, requestContext.tenantId);
      const result = await handlers.assignManualReview({
        ...requestContext,
        reviewCaseId: uuid.parse(req.params.id),
        reviewerId: principal.subjectId,
        ...camel(command),
      });
      res.status(200).json(result);
    }),
  );
  app.post(
    "/v1/manual-reviews/:id/recommendations",
    asyncRoute(async (req, res) => {
      const command = manualRecommendation.parse(req.body);
      const principal = await authenticate(req, authenticator, "ADMIN");
      const requestContext = context(req);
      assertTenant(principal.tenantId, requestContext.tenantId);
      const mapped = camel(command);
      const proposed = mapped.proposedTerms as
        Record<string, unknown> | undefined;
      if (proposed) delete proposed.currency;
      const result = await handlers.recommendManualDecision({
        ...requestContext,
        reviewCaseId: uuid.parse(req.params.id),
        reviewerId: principal.subjectId,
        ...mapped,
      });
      res.status(201).json(result);
    }),
  );
  app.post(
    "/v1/manual-reviews/:id/decisions",
    asyncRoute(async (req, res) => {
      const command = manualDecision.parse(req.body);
      const principal = await authenticate(req, authenticator, "ADMIN");
      const requestContext = context(req);
      assertTenant(principal.tenantId, requestContext.tenantId);
      const result = await handlers.decideApplicationManually({
        ...requestContext,
        reviewCaseId: uuid.parse(req.params.id),
        executorId: principal.subjectId,
        ...camel(command),
      });
      res.status(200).json(result);
    }),
  );
  app.post(
    "/v1/applications/:id/offers",
    asyncRoute(async (req, res) => {
      const command = loanOffer.parse(req.body);
      const principal = await authenticate(req, authenticator, "ADMIN");
      const requestContext = context(req);
      assertTenant(principal.tenantId, requestContext.tenantId);
      const result = await handlers.issueOffer({
        ...requestContext,
        applicationId: uuid.parse(req.params.id),
        actorId: principal.subjectId,
        ...camel(command),
      });
      res.status(201).json(result);
    }),
  );
  app.post(
    "/v1/customer/loan-offers/:id/accept",
    asyncRoute(async (req, res) => {
      const command = loanOfferAcceptance.parse(req.body);
      const principal = await authenticate(req, authenticator, "CUSTOMER");
      const requestContext = context(req);
      assertTenant(principal.tenantId, requestContext.tenantId);
      const mapped = camel(command);
      const { transactionAuthorizationToken: authorizationToken, ...input } =
        mapped;
      const result = await handlers.acceptOffer({
        ...requestContext,
        offerId: uuid.parse(req.params.id),
        customerId: principal.subjectId,
        authorizationToken,
        ...input,
      });
      res.status(200).json(result);
    }),
  );
  app.get(
    "/v1/customer/loan-products",
    asyncRoute(async (req, res) => {
      const customer = await customerContext(req, authenticator, false);
      res.status(200).json(await handlers.listCustomerProducts(customer));
    }),
  );
  app.post(
    "/v1/customer/loan-quotes",
    asyncRoute(async (req, res) => {
      const customer = await customerContext(req, authenticator, true);
      const command = customerLoanQuote.parse(req.body);
      res
        .status(200)
        .json(
          await handlers.quoteCustomerLoan({ ...customer, ...camel(command) }),
        );
    }),
  );
  app.get(
    "/v1/customer/loan-applications/:id",
    asyncRoute(async (req, res) => {
      const customer = await customerContext(req, authenticator, false);
      res.status(200).json(
        await handlers.getCustomerApplication({
          ...customer,
          applicationId: uuid.parse(req.params.id),
        }),
      );
    }),
  );
  app.get(
    "/v1/customer/loan-applications/:id/offer",
    asyncRoute(async (req, res) => {
      const customer = await customerContext(req, authenticator, false);
      res.status(200).json(
        await handlers.getCustomerOffer({
          ...customer,
          applicationId: uuid.parse(req.params.id),
        }),
      );
    }),
  );
  app.get(
    "/v1/customer/loans",
    asyncRoute(async (req, res) => {
      const customer = await customerContext(req, authenticator, false);
      res.status(200).json(await handlers.listCustomerLoans(customer));
    }),
  );
  app.post(
    "/v1/customer/loans/:id/repayment-quotes",
    asyncRoute(async (req, res) => {
      const customer = await customerContext(req, authenticator, true);
      const command = repaymentQuote.parse(req.body);
      res.status(200).json(
        await handlers.quoteCustomerRepayment({
          ...customer,
          loanId: uuid.parse(req.params.id),
          ...camel(command),
          source: command.source.toUpperCase(),
        }),
      );
    }),
  );
  app.post(
    "/v1/customer/loans/:id/repayments",
    asyncRoute(async (req, res) => {
      const customer = await customerContext(req, authenticator, true);
      const command = customerRepayment.parse(req.body);
      const mapped = camel(command);
      const { transactionAuthorizationToken: authorizationToken, ...input } =
        mapped;
      res.status(202).json(
        await handlers.requestCustomerRepayment({
          ...customer,
          loanId: uuid.parse(req.params.id),
          ...input,
          ...(authorizationToken === undefined ? {} : { authorizationToken }),
        }),
      );
    }),
  );

  app.post(
    "/internal/v1/loans/:id/disburse",
    asyncRoute(async (req, res) => {
      const command = disbursement.parse(req.body);
      const secured = await securedContext(req, authenticator, "SERVICE");
      const result = await handlers.disburse({
        ...secured,
        loanId: uuid.parse(req.params.id),
        ...camel(command),
      });
      res.status(202).json(result);
    }),
  );
  app.post(
    "/internal/v1/write-off-recoveries",
    asyncRoute(async (req, res) => {
      const command = writeOffRecovery.parse(req.body);
      const secured = await securedContext(req, authenticator, "SERVICE");
      const result = await handlers.postWriteOffRecovery({
        ...secured,
        ...camel(command),
      });
      res.status(201).json(result);
    }),
  );
  app.post(
    "/internal/v1/repayments/:id/reverse",
    asyncRoute(async (req, res) => {
      const command = repaymentReversal.parse(req.body);
      const secured = await securedContext(req, authenticator, "SERVICE");
      const result = await handlers.reverseRepayment({
        ...secured,
        repaymentId: uuid.parse(req.params.id),
        ...camel(command),
      });
      res.status(200).json(result);
    }),
  );
  app.post(
    "/internal/v2/repayments",
    asyncRoute(async (req, res) => {
      const command = repayment.parse(req.body);
      const secured = await securedContext(req, authenticator, "SERVICE");
      const result = await handlers.recordRepayment({
        ...secured,
        ...camel(command),
      });
      res.status(201).json(result);
    }),
  );
  app.post(
    "/v1/loans/:id/restructures",
    asyncRoute(async (req, res) => {
      const command = restructure.parse(req.body);
      const secured = await securedContext(req, authenticator, "ADMIN");
      const result = await handlers.restructure({
        ...secured,
        loanId: uuid.parse(req.params.id),
        ...camel(command),
      });
      res.status(202).json(result);
    }),
  );
  app.post(
    "/v1/loans/:id/write-offs",
    asyncRoute(async (req, res) => {
      const command = writeOff.parse(req.body);
      const secured = await securedContext(req, authenticator, "ADMIN");
      const result = await handlers.writeOff({
        ...secured,
        loanId: uuid.parse(req.params.id),
        ...camel(command),
      });
      res.status(202).json(result);
    }),
  );

  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      void _next;
      if (error instanceof AuthenticationError)
        return res.status(401).json({
          code: "UNAUTHENTICATED",
          message: error.message,
        });
      if (error instanceof z.ZodError)
        return res
          .status(400)
          .json({ code: "INVALID_REQUEST", details: error.flatten() });
      return res.status(422).json({
        code: "COMMAND_REJECTED",
        message: error instanceof Error ? error.message : "Command rejected",
      });
    },
  );
  return app;
}

async function authenticate(
  req: Request,
  authenticator: LendingAuthenticator,
  audience: "CUSTOMER" | "ADMIN" | "SERVICE",
) {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer "))
    throw new AuthenticationError("Bearer access token is required");
  return authenticator.authenticate({ authorization, audience });
}

function assertTenant(claimTenantId: string, headerTenantId: string): void {
  if (claimTenantId !== headerTenantId)
    throw new AuthenticationError("Token tenant does not match request tenant");
}

class AuthenticationError extends Error {}

function asyncRoute(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res).catch(next);
  };
}

function camel(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      Array.isArray(item)
        ? (item as unknown[]).map((entry): unknown =>
            entry && typeof entry === "object"
              ? camel(entry as Record<string, unknown>)
              : entry,
          )
        : item && typeof item === "object"
          ? camel(item as Record<string, unknown>)
          : item,
    ]),
  );
}

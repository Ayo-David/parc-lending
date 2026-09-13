import type { Knex } from "knex";

export const config = { transaction: false };

/** Approved LENDING-DB-128 through LENDING-DB-130. */
export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("loan_quotes")) return;
  await knex.raw(`
    CREATE TABLE public.loan_quotes(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
      customer_id uuid NOT NULL, product_version_id uuid NOT NULL,
      amount bigint NOT NULL CHECK(amount>0), currency char(3) NOT NULL CHECK(currency='NGN'),
      tenure_days integer NOT NULL CHECK(tenure_days>0), repayment_frequency varchar(30) NOT NULL,
      purpose text, customer_inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
      total_interest bigint NOT NULL CHECK(total_interest>=0), total_fees bigint NOT NULL CHECK(total_fees>=0),
      total_repayable bigint NOT NULL CHECK(total_repayable=amount+total_interest+total_fees),
      maturity_date date NOT NULL, schedule jsonb NOT NULL,
      configuration_hash char(64) NOT NULL, calculation_policy_version varchar(100) NOT NULL,
      calculation_input_hash char(64) NOT NULL, calculation_output_hash char(64) NOT NULL,
      idempotency_key varchar(255) NOT NULL, request_hash char(64) NOT NULL,
      expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
      retention_until date NOT NULL DEFAULT (current_date + 2557), legal_hold boolean NOT NULL DEFAULT false,
      UNIQUE(tenant_id,id), UNIQUE(tenant_id,idempotency_key),
      FOREIGN KEY(tenant_id,product_version_id) REFERENCES public.loan_product_versions(tenant_id,id),
      CHECK(jsonb_typeof(customer_inputs)='object'), CHECK(jsonb_typeof(schedule)='array')
    );
    CREATE INDEX idx_loan_quote_customer ON public.loan_quotes(tenant_id,customer_id,created_at DESC);

    CREATE TABLE public.loan_repayment_quotes(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
      customer_id uuid NOT NULL, loan_id uuid NOT NULL,
      amount bigint NOT NULL CHECK(amount>0), currency char(3) NOT NULL CHECK(currency='NGN'),
      source varchar(30) NOT NULL CHECK(source IN('WALLET','DIRECT_DEBIT','VIRTUAL_ACCOUNT','MANUAL_BANK_TRANSFER')),
      outstanding_snapshot jsonb NOT NULL, allocation_preview jsonb NOT NULL,
      calculation_input_hash char(64) NOT NULL, calculation_output_hash char(64) NOT NULL,
      idempotency_key varchar(255) NOT NULL, request_hash char(64) NOT NULL,
      expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
      retention_until date NOT NULL DEFAULT (current_date + 2557), legal_hold boolean NOT NULL DEFAULT false,
      UNIQUE(tenant_id,id), UNIQUE(tenant_id,idempotency_key),
      FOREIGN KEY(tenant_id,loan_id) REFERENCES public.loans(tenant_id,id),
      CHECK(jsonb_typeof(outstanding_snapshot)='object'), CHECK(jsonb_typeof(allocation_preview)='object')
    );
    CREATE INDEX idx_repayment_quote_customer ON public.loan_repayment_quotes(tenant_id,customer_id,created_at DESC);

    CREATE TABLE public.loan_repayment_requests(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
      customer_id uuid NOT NULL, loan_id uuid NOT NULL, repayment_quote_id uuid NOT NULL,
      status varchar(30) NOT NULL CHECK(status IN('SUBMITTING','PENDING_COLLECTION','PENDING_MATCH','CONFIRMED','FAILED','MANUAL_REVIEW')),
      authorization_reference varchar(255), authorization_evidence_hash char(64),
      collection_reference varchar(255), payment_request_id uuid, payment_correlation_id uuid NOT NULL,
      idempotency_key varchar(255) NOT NULL, request_hash char(64) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
      retention_until date NOT NULL DEFAULT (current_date + 2557), legal_hold boolean NOT NULL DEFAULT false,
      UNIQUE(tenant_id,id), UNIQUE(tenant_id,idempotency_key),
      FOREIGN KEY(tenant_id,loan_id) REFERENCES public.loans(tenant_id,id),
      FOREIGN KEY(tenant_id,repayment_quote_id) REFERENCES public.loan_repayment_quotes(tenant_id,id),
      CHECK((authorization_reference IS NULL)=(authorization_evidence_hash IS NULL))
    );
    CREATE INDEX idx_repayment_request_status ON public.loan_repayment_requests(status,updated_at)
      WHERE status IN('SUBMITTING','PENDING_COLLECTION','PENDING_MATCH','MANUAL_REVIEW');

    CREATE OR REPLACE FUNCTION public.protect_customer_quote_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'Customer lending quote evidence is immutable'; END $$;
    CREATE TRIGGER trg_protect_loan_quote BEFORE UPDATE OR DELETE ON public.loan_quotes
      FOR EACH ROW EXECUTE FUNCTION public.protect_customer_quote_evidence();
    CREATE TRIGGER trg_protect_repayment_quote BEFORE UPDATE OR DELETE ON public.loan_repayment_quotes
      FOR EACH ROW EXECUTE FUNCTION public.protect_customer_quote_evidence();
    CREATE OR REPLACE FUNCTION public.protect_repayment_request_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF TG_OP='DELETE' OR (to_jsonb(NEW)-'status'-'payment_request_id'-'updated_at')
        IS DISTINCT FROM (to_jsonb(OLD)-'status'-'payment_request_id'-'updated_at')
        THEN RAISE EXCEPTION 'Repayment request evidence is immutable'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER trg_protect_repayment_request BEFORE UPDATE OR DELETE ON public.loan_repayment_requests
      FOR EACH ROW EXECUTE FUNCTION public.protect_repayment_request_evidence();
    CREATE OR REPLACE FUNCTION public.validate_repayment_request_transition() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.status IS DISTINCT FROM OLD.status AND NOT(
        (OLD.status='SUBMITTING' AND NEW.status IN('PENDING_COLLECTION','PENDING_MATCH','FAILED','MANUAL_REVIEW')) OR
        (OLD.status IN('PENDING_COLLECTION','PENDING_MATCH') AND NEW.status IN('CONFIRMED','FAILED','MANUAL_REVIEW'))
      ) THEN RAISE EXCEPTION 'Invalid repayment request transition'; END IF;
      IF NEW.status IN('PENDING_COLLECTION','PENDING_MATCH','CONFIRMED') AND NEW.payment_request_id IS NULL
      THEN RAISE EXCEPTION 'Payment request evidence is required'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER trg_validate_repayment_request_transition BEFORE UPDATE ON public.loan_repayment_requests
      FOR EACH ROW EXECUTE FUNCTION public.validate_repayment_request_transition();

    ALTER TABLE public.loan_quotes ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_quotes FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_repayment_quotes ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_repayment_quotes FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_repayment_requests ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_repayment_requests FORCE ROW LEVEL SECURITY;
    CREATE POLICY loan_quote_tenant_policy ON public.loan_quotes USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    CREATE POLICY repayment_quote_tenant_policy ON public.loan_repayment_quotes USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    CREATE POLICY repayment_request_tenant_policy ON public.loan_repayment_requests USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    GRANT SELECT,INSERT ON public.loan_quotes,public.loan_repayment_quotes TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT,INSERT,UPDATE ON public.loan_repayment_requests TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_quotes,public.loan_repayment_quotes,public.loan_repayment_requests TO parc_lending_readonly;
  `);
}

export function down(): Promise<never> {
  return Promise.reject(
    new Error("LENDING-DB-128 through LENDING-DB-130 are forward-only"),
  );
}

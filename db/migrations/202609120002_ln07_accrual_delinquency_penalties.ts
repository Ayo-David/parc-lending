import type { Knex } from "knex";

export const config = { transaction: false };

/** Approved LENDING-DB-89 through LENDING-DB-104. */
export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("loan_penalty_assessments")) return;
  await knex.raw(`
    CREATE OR REPLACE FUNCTION public.valid_delinquency_buckets(value jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
      SELECT jsonb_typeof(value)='array' AND jsonb_array_length(value)>0
        AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(value) item
          WHERE jsonb_typeof(item)<>'object' OR NOT(jsonb_exists(item,'code') AND jsonb_exists(item,'minimum_dpd'))
            OR (item->>'minimum_dpd') !~ '^[0-9]+$')
        AND (SELECT count(*)=count(DISTINCT item->>'code') FROM jsonb_array_elements(value) item)
        AND (SELECT count(*)=count(DISTINCT (item->>'minimum_dpd')::integer) FROM jsonb_array_elements(value) item) $$;
    ALTER TABLE public.loan_product_versions
      ADD COLUMN delinquency_buckets jsonb NOT NULL DEFAULT '[{"code":"CURRENT","minimum_dpd":0},{"code":"WATCH","minimum_dpd":1},{"code":"DELINQUENT","minimum_dpd":30},{"code":"DEFAULT","minimum_dpd":90}]'::jsonb,
      ADD CONSTRAINT chk_product_version_delinquency_buckets CHECK(public.valid_delinquency_buckets(delinquency_buckets));

    ALTER TABLE public.loan_interest_accruals
      ALTER COLUMN opening_principal TYPE bigint USING round(opening_principal*100)::bigint,
      ALTER COLUMN annualized_rate TYPE numeric(18,10),
      ALTER COLUMN interest_amount TYPE bigint USING round(interest_amount*100)::bigint,
      ALTER COLUMN status TYPE varchar(20) USING status::text,
      ADD COLUMN product_version_id uuid, ADD COLUMN installment_id uuid,
      ADD COLUMN unrounded_interest numeric(30,12), ADD COLUMN rounding_mode varchar(30),
      ADD COLUMN day_count_convention varchar(20), ADD COLUMN calculation_policy_version varchar(50),
      ADD COLUMN configuration_hash char(64), ADD COLUMN calculation_input_hash char(64),
      ADD COLUMN calculation_output_hash char(64), ADD COLUMN idempotency_key varchar(255),
      ADD COLUMN correlation_id uuid, ADD COLUMN causation_id uuid,
      ADD COLUMN ledger_idempotency_key varchar(255), ADD COLUMN reversal_ledger_transaction_id uuid,
      ADD COLUMN attempt_count integer NOT NULL DEFAULT 0, ADD COLUMN available_at timestamptz NOT NULL DEFAULT now(),
      ADD COLUMN lease_expires_at timestamptz, ADD COLUMN retention_until date NOT NULL DEFAULT(current_date+2557),
      ADD COLUMN legal_hold boolean NOT NULL DEFAULT false,
      ADD CONSTRAINT uq_interest_accrual_tenant_id UNIQUE(tenant_id,id),
      ADD CONSTRAINT uq_interest_accrual_idempotency UNIQUE(tenant_id,idempotency_key),
      ADD CONSTRAINT uq_interest_accrual_period_tenant UNIQUE(tenant_id,loan_id,period_start,period_end),
      ADD CONSTRAINT fk_interest_accrual_loan_tenant FOREIGN KEY(tenant_id,loan_id) REFERENCES public.loans(tenant_id,id),
      ADD CONSTRAINT fk_interest_accrual_version_tenant FOREIGN KEY(tenant_id,product_version_id) REFERENCES public.loan_product_versions(tenant_id,id),
      ADD CONSTRAINT fk_interest_accrual_installment_tenant FOREIGN KEY(tenant_id,installment_id) REFERENCES public.loan_installments(tenant_id,id),
      ADD CONSTRAINT chk_interest_accrual_ngn CHECK(currency='NGN'),
      ADD CONSTRAINT chk_interest_accrual_state CHECK(status IN('PENDING','POSTING','POSTED','REVERSED','FAILED','MANUAL_REVIEW')),
      ADD CONSTRAINT chk_interest_accrual_evidence CHECK(status='PENDING' OR
        (product_version_id IS NOT NULL AND unrounded_interest IS NOT NULL AND rounding_mode IS NOT NULL
         AND day_count_convention IS NOT NULL AND calculation_policy_version IS NOT NULL
         AND configuration_hash IS NOT NULL AND calculation_input_hash IS NOT NULL
         AND calculation_output_hash IS NOT NULL AND idempotency_key IS NOT NULL)),
      ADD CONSTRAINT chk_interest_accrual_ledger CHECK(status NOT IN('POSTED','REVERSED') OR ledger_transaction_id IS NOT NULL);

    CREATE TABLE public.loan_servicing_runs(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, run_date date NOT NULL,
      run_type varchar(30) NOT NULL CHECK(run_type IN('INTEREST_ACCRUAL','PENALTY','DELINQUENCY','ALL')),
      status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN('PENDING','RUNNING','COMPLETED','FAILED')),
      idempotency_key varchar(255) NOT NULL, checkpoint_loan_id uuid, attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count>=0),
      lease_expires_at timestamptz, started_at timestamptz, completed_at timestamptz, last_error text,
      created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,id), UNIQUE(tenant_id,idempotency_key)
    );
    CREATE TABLE public.loan_penalty_assessments(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, loan_id uuid NOT NULL,
      installment_id uuid NOT NULL, product_version_id uuid NOT NULL, assessment_date date NOT NULL,
      assessment_period_start date NOT NULL, assessment_period_end date NOT NULL,
      penalty_type varchar(20) NOT NULL CHECK(penalty_type IN('FIXED','PERCENTAGE')),
      penalty_frequency varchar(20) NOT NULL CHECK(penalty_frequency IN('ONCE','DAILY','WEEKLY','MONTHLY')),
      basis_amount bigint NOT NULL CHECK(basis_amount>=0), penalty_rate numeric(18,10), fixed_amount bigint,
      unrounded_amount numeric(30,12) NOT NULL, amount bigint NOT NULL CHECK(amount>=0),
      cumulative_before bigint NOT NULL CHECK(cumulative_before>=0), cap_amount bigint,
      grace_period_days integer NOT NULL CHECK(grace_period_days>=0), compounds boolean NOT NULL DEFAULT false,
      currency char(3) NOT NULL DEFAULT 'NGN', status varchar(20) NOT NULL DEFAULT 'PENDING',
      policy_hash char(64) NOT NULL, calculation_input_hash char(64) NOT NULL, calculation_output_hash char(64) NOT NULL,
      rounding_mode varchar(30) NOT NULL, calculation_policy_version varchar(50) NOT NULL,
      idempotency_key varchar(255) NOT NULL, correlation_id uuid NOT NULL, ledger_idempotency_key varchar(255) NOT NULL,
      ledger_transaction_id uuid, reversal_ledger_transaction_id uuid, posted_at timestamptz,
      retention_until date NOT NULL DEFAULT(current_date+2557), legal_hold boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(), CHECK(currency='NGN'), CHECK(compounds=false),
      CHECK(assessment_period_end>=assessment_period_start),
      CHECK((penalty_type='FIXED' AND fixed_amount IS NOT NULL AND penalty_rate IS NULL) OR
            (penalty_type='PERCENTAGE' AND penalty_rate IS NOT NULL AND fixed_amount IS NULL)),
      CHECK(cap_amount IS NULL OR cumulative_before+amount<=cap_amount),
      CHECK(status IN('PENDING','POSTING','POSTED','REVERSED','FAILED','MANUAL_REVIEW')),
      CHECK(status NOT IN('POSTED','REVERSED') OR ledger_transaction_id IS NOT NULL),
      UNIQUE(tenant_id,id), UNIQUE(tenant_id,idempotency_key),
      UNIQUE(tenant_id,installment_id,assessment_period_start,assessment_period_end,penalty_frequency),
      FOREIGN KEY(tenant_id,loan_id) REFERENCES public.loans(tenant_id,id),
      FOREIGN KEY(tenant_id,installment_id) REFERENCES public.loan_installments(tenant_id,id),
      FOREIGN KEY(tenant_id,product_version_id) REFERENCES public.loan_product_versions(tenant_id,id)
    );
    CREATE TABLE public.loan_delinquency_assessments(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, loan_id uuid NOT NULL,
      assessment_date date NOT NULL, days_past_due integer NOT NULL CHECK(days_past_due>=0),
      previous_bucket varchar(50), bucket varchar(50) NOT NULL, oldest_unpaid_due_date date,
      grace_period_days integer NOT NULL CHECK(grace_period_days>=0), timezone varchar(64) NOT NULL,
      outstanding_amount bigint NOT NULL CHECK(outstanding_amount>=0), policy_hash char(64) NOT NULL,
      idempotency_key varchar(255) NOT NULL, correlation_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(), retention_until date NOT NULL DEFAULT(current_date+2557),
      legal_hold boolean NOT NULL DEFAULT false, UNIQUE(tenant_id,id), UNIQUE(tenant_id,loan_id,assessment_date),
      UNIQUE(tenant_id,idempotency_key), FOREIGN KEY(tenant_id,loan_id) REFERENCES public.loans(tenant_id,id)
    );

    CREATE OR REPLACE FUNCTION public.protect_final_servicing_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF TG_OP='DELETE' OR OLD.status IN('POSTED','REVERSED','FAILED') THEN RAISE EXCEPTION 'Final servicing evidence is immutable'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER trg_protect_final_interest_accrual BEFORE UPDATE OR DELETE ON public.loan_interest_accruals FOR EACH ROW EXECUTE FUNCTION public.protect_final_servicing_evidence();
    CREATE TRIGGER trg_protect_final_penalty BEFORE UPDATE OR DELETE ON public.loan_penalty_assessments FOR EACH ROW EXECUTE FUNCTION public.protect_final_servicing_evidence();
    CREATE OR REPLACE FUNCTION public.protect_delinquency_assessment() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Delinquency assessment is immutable'; END $$;
    CREATE TRIGGER trg_protect_delinquency_assessment BEFORE UPDATE OR DELETE ON public.loan_delinquency_assessments FOR EACH ROW EXECUTE FUNCTION public.protect_delinquency_assessment();
    CREATE INDEX idx_accrual_worker ON public.loan_interest_accruals(status,available_at,lease_expires_at) WHERE status IN('PENDING','POSTING','MANUAL_REVIEW');
    CREATE INDEX idx_penalty_worker ON public.loan_penalty_assessments(status,assessment_date) WHERE status IN('PENDING','POSTING','MANUAL_REVIEW');
    CREATE INDEX idx_delinquency_current ON public.loan_delinquency_assessments(tenant_id,loan_id,assessment_date DESC);
    CREATE INDEX idx_servicing_run_worker ON public.loan_servicing_runs(status,run_date,lease_expires_at) WHERE status IN('PENDING','RUNNING');
    ALTER TABLE public.loan_servicing_runs ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_servicing_runs FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_penalty_assessments ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_penalty_assessments FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_delinquency_assessments ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_delinquency_assessments FORCE ROW LEVEL SECURITY;
    CREATE POLICY servicing_run_tenant_policy ON public.loan_servicing_runs USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    CREATE POLICY penalty_assessment_tenant_policy ON public.loan_penalty_assessments USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    CREATE POLICY delinquency_assessment_tenant_policy ON public.loan_delinquency_assessments USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    GRANT SELECT,INSERT,UPDATE ON public.loan_servicing_runs,public.loan_penalty_assessments TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT,INSERT ON public.loan_delinquency_assessments TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_servicing_runs,public.loan_penalty_assessments,public.loan_delinquency_assessments TO parc_lending_readonly;
  `);
}

export function down(): Promise<never> {
  return Promise.reject(new Error("LN-07 servicing controls are forward-only"));
}

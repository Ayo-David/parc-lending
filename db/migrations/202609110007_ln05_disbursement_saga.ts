import type { Knex } from "knex";
export const config = { transaction: false };
/** Approved LENDING-DB-60 through LENDING-DB-72. */
export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("loan_disbursement_saga_steps")) return;
  await knex.raw(`
    ALTER TABLE public.lending_ledger_posting_requests ALTER COLUMN amount TYPE bigint USING round(amount*100)::bigint;
    ALTER TABLE public.loan_disbursements ALTER COLUMN amount TYPE bigint USING round(amount*100)::bigint,
      ALTER COLUMN status TYPE varchar(30) USING status::text,
      ADD COLUMN destination_reference varchar(255), ADD COLUMN approval_id uuid, ADD COLUMN approval_payload_hash char(64),
      ADD COLUMN approval_consumed_at timestamptz, ADD COLUMN approval_maker_id uuid, ADD COLUMN approval_checker_ids jsonb,
      ADD COLUMN idempotency_key varchar(255), ADD COLUMN request_hash char(64), ADD COLUMN correlation_id uuid,
      ADD COLUMN ledger_reversal_transaction_id uuid, ADD COLUMN active_step varchar(50), ADD COLUMN attempt_count integer NOT NULL DEFAULT 0,
      ADD COLUMN lease_expires_at timestamptz, ADD COLUMN next_inquiry_at timestamptz, ADD COLUMN failure_code varchar(100),
      ADD COLUMN outcome_evidence_hash char(64), ADD COLUMN retention_until date NOT NULL DEFAULT(current_date+2557),
      ADD COLUMN legal_hold boolean NOT NULL DEFAULT false, ADD CONSTRAINT uq_disbursement_tenant_id UNIQUE(tenant_id,id),
      ADD CONSTRAINT uq_disbursement_idempotency UNIQUE(tenant_id,idempotency_key), ADD CONSTRAINT chk_disbursement_ngn CHECK(currency='NGN'),
      ADD CONSTRAINT chk_disbursement_state CHECK(status IN('CREATED','APPROVAL_PENDING','LEDGER_POSTING','PAYMENT_SUBMITTING','PENDING','SUCCEEDED','COMPENSATING','COMPENSATED','FAILED','MANUAL_REVIEW')),
      ADD CONSTRAINT chk_disbursement_approval CHECK(status IN('CREATED','APPROVAL_PENDING') OR (approval_id IS NOT NULL AND approval_payload_hash IS NOT NULL AND approval_consumed_at IS NOT NULL)),
      ADD CONSTRAINT chk_disbursement_ledger_before_payment CHECK(status NOT IN('PAYMENT_SUBMITTING','PENDING','SUCCEEDED') OR ledger_transaction_id IS NOT NULL);
    CREATE UNIQUE INDEX uq_successful_disbursement_per_loan ON public.loan_disbursements(tenant_id,loan_id) WHERE status='SUCCEEDED';
    CREATE INDEX idx_disbursement_recovery ON public.loan_disbursements(status,next_inquiry_at,lease_expires_at) WHERE status IN('PENDING','COMPENSATING','MANUAL_REVIEW');
    CREATE TABLE public.loan_disbursement_saga_steps(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,disbursement_id uuid NOT NULL,
      step_type varchar(50) NOT NULL CHECK(step_type IN('APPROVAL','LEDGER_POST','PAYMENT_SUBMIT','PAYMENT_INQUIRY','LEDGER_REVERSAL')),
      attempt_number integer NOT NULL CHECK(attempt_number>0),status varchar(20) NOT NULL CHECK(status IN('STARTED','PENDING','SUCCEEDED','FAILED','AMBIGUOUS')),
      idempotency_key varchar(255) NOT NULL,request_hash char(64) NOT NULL,response_reference varchar(255),evidence_hash char(64),
      error_code varchar(100),created_at timestamptz NOT NULL DEFAULT now(),completed_at timestamptz,retention_until date NOT NULL DEFAULT(current_date+2557),legal_hold boolean NOT NULL DEFAULT false,
      UNIQUE(tenant_id,id),UNIQUE(tenant_id,disbursement_id,step_type,attempt_number),UNIQUE(tenant_id,idempotency_key),
      FOREIGN KEY(tenant_id,disbursement_id) REFERENCES public.loan_disbursements(tenant_id,id));
    CREATE OR REPLACE FUNCTION public.protect_disbursement_step() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF TG_OP='DELETE' OR OLD.status IN('SUCCEEDED','FAILED','AMBIGUOUS') THEN RAISE EXCEPTION 'Completed saga evidence is immutable'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER trg_protect_disbursement_step BEFORE UPDATE OR DELETE ON public.loan_disbursement_saga_steps FOR EACH ROW EXECUTE FUNCTION public.protect_disbursement_step();
    ALTER TABLE public.loan_disbursement_saga_steps ENABLE ROW LEVEL SECURITY;ALTER TABLE public.loan_disbursement_saga_steps FORCE ROW LEVEL SECURITY;
    CREATE POLICY disbursement_step_tenant_policy ON public.loan_disbursement_saga_steps USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    GRANT SELECT,INSERT,UPDATE ON public.loan_disbursement_saga_steps TO parc_lending_runtime,parc_lending_worker;GRANT SELECT ON public.loan_disbursement_saga_steps TO parc_lending_readonly;
  `);
}
export function down(): Promise<never> {
  return Promise.reject(new Error("LN-05 disbursement saga is forward-only"));
}

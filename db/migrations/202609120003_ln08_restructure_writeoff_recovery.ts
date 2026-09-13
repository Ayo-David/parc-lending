import type { Knex } from "knex";

export const config = { transaction: false };

/** Approved LENDING-DB-105 through LENDING-DB-122. */
export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("loan_restructure_history")) return;
  await knex.raw(`
    ALTER TABLE public.loan_product_versions ADD COLUMN writeoff_eligibility jsonb NOT NULL DEFAULT '{"minimum_dpd":90}'::jsonb,
      ADD CONSTRAINT chk_writeoff_eligibility CHECK(jsonb_typeof(writeoff_eligibility)='object' AND jsonb_exists(writeoff_eligibility,'minimum_dpd') AND (writeoff_eligibility->>'minimum_dpd')~'^[0-9]+$');
    ALTER TABLE public.loan_adjustments ALTER COLUMN amount TYPE bigint USING round(amount*100)::bigint,
      ADD COLUMN approval_id uuid, ADD COLUMN approval_payload_hash char(64), ADD COLUMN approval_consumed_at timestamptz,
      ADD COLUMN approval_maker_id uuid, ADD COLUMN approval_checker_ids jsonb, ADD COLUMN executor_id uuid,
      ADD COLUMN idempotency_key varchar(255), ADD COLUMN request_hash char(64), ADD COLUMN correlation_id uuid,
      ADD COLUMN retention_until date NOT NULL DEFAULT(current_date+2557), ADD COLUMN legal_hold boolean NOT NULL DEFAULT false,
      ADD CONSTRAINT uq_adjustment_tenant_id UNIQUE(tenant_id,id), ADD CONSTRAINT uq_adjustment_idempotency UNIQUE(tenant_id,idempotency_key),
      ADD CONSTRAINT chk_adjustment_ngn CHECK(currency='NGN'), ADD CONSTRAINT chk_adjustment_approval CHECK(approval_id IS NOT NULL AND approval_payload_hash IS NOT NULL AND approval_consumed_at IS NOT NULL AND approval_maker_id IS NOT NULL AND jsonb_array_length(approval_checker_ids)>0 AND executor_id IS NOT NULL AND NOT(approval_checker_ids @> to_jsonb(ARRAY[approval_maker_id::text,executor_id::text])));
    ALTER TABLE public.loan_restructures
      ALTER COLUMN previous_principal TYPE bigint USING round(previous_principal*100)::bigint,
      ALTER COLUMN new_principal TYPE bigint USING round(new_principal*100)::bigint,
      ALTER COLUMN previous_interest_rate TYPE numeric(18,10), ALTER COLUMN new_interest_rate TYPE numeric(18,10),
      ALTER COLUMN status TYPE varchar(25) USING status::text,
      ADD COLUMN previous_balance_snapshot jsonb, ADD COLUMN proposed_terms jsonb, ADD COLUMN calculation_policy_version varchar(50),
      ADD COLUMN calculation_input_hash char(64), ADD COLUMN calculation_output_hash char(64), ADD COLUMN configuration_hash char(64),
      ADD COLUMN unrounded_total_interest numeric(30,12), ADD COLUMN rounding_mode varchar(30), ADD COLUMN day_count_convention varchar(20),
      ADD COLUMN capitalization_authorized boolean NOT NULL DEFAULT false, ADD COLUMN approval_id uuid,
      ADD COLUMN approval_payload_hash char(64), ADD COLUMN approval_consumed_at timestamptz, ADD COLUMN approval_maker_id uuid,
      ADD COLUMN approval_checker_ids jsonb, ADD COLUMN approved_authority_level integer, ADD COLUMN executor_id uuid,
      ADD COLUMN idempotency_key varchar(255), ADD COLUMN request_hash char(64), ADD COLUMN correlation_id uuid,
      ADD COLUMN ledger_idempotency_key varchar(255), ADD COLUMN ledger_transaction_id uuid,
      ADD COLUMN version integer NOT NULL DEFAULT 0, ADD COLUMN retention_until date NOT NULL DEFAULT(current_date+2557),
      ADD COLUMN legal_hold boolean NOT NULL DEFAULT false,
      ADD CONSTRAINT uq_restructure_tenant_id UNIQUE(tenant_id,id), ADD CONSTRAINT uq_restructure_idempotency UNIQUE(tenant_id,idempotency_key),
      ADD CONSTRAINT fk_restructure_loan_tenant FOREIGN KEY(tenant_id,loan_id) REFERENCES public.loans(tenant_id,id),
      ADD CONSTRAINT fk_restructure_previous_schedule_tenant FOREIGN KEY(tenant_id,previous_schedule_id) REFERENCES public.loan_schedules(tenant_id,id),
      ADD CONSTRAINT fk_restructure_new_schedule_tenant FOREIGN KEY(tenant_id,new_schedule_id) REFERENCES public.loan_schedules(tenant_id,id),
      ADD CONSTRAINT chk_restructure_status CHECK(status IN('REQUESTED','APPROVAL_PENDING','APPROVED','LEDGER_POSTING','IMPLEMENTED','REJECTED','CANCELLED','MANUAL_REVIEW')),
      ADD CONSTRAINT chk_restructure_approval CHECK(status IN('REQUESTED','APPROVAL_PENDING','REJECTED','CANCELLED') OR (approval_id IS NOT NULL AND approval_payload_hash IS NOT NULL AND approval_consumed_at IS NOT NULL AND approval_maker_id IS NOT NULL AND jsonb_array_length(approval_checker_ids)>0 AND approved_authority_level>=2 AND executor_id IS NOT NULL AND executor_id<>approval_maker_id)),
      ADD CONSTRAINT chk_restructure_evidence CHECK(status NOT IN('APPROVED','LEDGER_POSTING','IMPLEMENTED') OR (previous_balance_snapshot IS NOT NULL AND proposed_terms IS NOT NULL AND calculation_policy_version IS NOT NULL AND calculation_input_hash IS NOT NULL AND calculation_output_hash IS NOT NULL AND configuration_hash IS NOT NULL AND unrounded_total_interest IS NOT NULL AND rounding_mode IS NOT NULL AND day_count_convention IS NOT NULL)),
      ADD CONSTRAINT chk_restructure_ledger CHECK(status<>'IMPLEMENTED' OR ledger_transaction_id IS NOT NULL);
    CREATE UNIQUE INDEX uq_active_restructure ON public.loan_restructures(tenant_id,loan_id) WHERE status IN('REQUESTED','APPROVAL_PENDING','APPROVED','LEDGER_POSTING');

    ALTER TABLE public.loan_write_offs
      ALTER COLUMN principal_amount TYPE bigint USING round(principal_amount*100)::bigint,
      ALTER COLUMN interest_amount TYPE bigint USING round(interest_amount*100)::bigint,
      ALTER COLUMN fees_amount TYPE bigint USING round(fees_amount*100)::bigint,
      ALTER COLUMN penalties_amount TYPE bigint USING round(penalties_amount*100)::bigint,
      ALTER COLUMN total_amount TYPE bigint USING round(total_amount*100)::bigint,
      ALTER COLUMN status TYPE varchar(25) USING status::text,
      ADD COLUMN product_version_id uuid, ADD COLUMN eligibility_snapshot jsonb, ADD COLUMN balance_snapshot_hash char(64),
      ADD COLUMN approval_id uuid, ADD COLUMN approval_payload_hash char(64), ADD COLUMN approval_consumed_at timestamptz,
      ADD COLUMN approval_maker_id uuid, ADD COLUMN approval_checker_ids jsonb, ADD COLUMN approved_authority_level integer,
      ADD COLUMN executor_id uuid, ADD COLUMN idempotency_key varchar(255), ADD COLUMN request_hash char(64), ADD COLUMN correlation_id uuid,
      ADD COLUMN ledger_idempotency_key varchar(255), ADD COLUMN reversal_ledger_transaction_id uuid,
      ADD COLUMN recovered_amount bigint NOT NULL DEFAULT 0, ADD COLUMN retention_until date NOT NULL DEFAULT(current_date+2557),
      ADD COLUMN legal_hold boolean NOT NULL DEFAULT false,
      ADD CONSTRAINT uq_writeoff_tenant_id UNIQUE(tenant_id,id), ADD CONSTRAINT uq_writeoff_idempotency UNIQUE(tenant_id,idempotency_key),
      ADD CONSTRAINT fk_writeoff_loan_tenant FOREIGN KEY(tenant_id,loan_id) REFERENCES public.loans(tenant_id,id),
      ADD CONSTRAINT fk_writeoff_version_tenant FOREIGN KEY(tenant_id,product_version_id) REFERENCES public.loan_product_versions(tenant_id,id),
      ADD CONSTRAINT chk_writeoff_ngn CHECK(currency='NGN'), ADD CONSTRAINT chk_writeoff_recovered CHECK(recovered_amount>=0 AND recovered_amount<=total_amount),
      ADD CONSTRAINT chk_writeoff_status CHECK(status IN('PENDING','APPROVAL_PENDING','APPROVED','LEDGER_POSTING','COMPLETED','REVERSED','REJECTED','MANUAL_REVIEW')),
      ADD CONSTRAINT chk_writeoff_approval CHECK(status IN('PENDING','APPROVAL_PENDING','REJECTED') OR (approval_id IS NOT NULL AND approval_payload_hash IS NOT NULL AND approval_consumed_at IS NOT NULL AND approval_maker_id IS NOT NULL AND jsonb_array_length(approval_checker_ids)>0 AND approved_authority_level>=2 AND executor_id IS NOT NULL AND executor_id<>approval_maker_id)),
      ADD CONSTRAINT chk_writeoff_evidence CHECK(status IN('PENDING','APPROVAL_PENDING','REJECTED') OR (product_version_id IS NOT NULL AND eligibility_snapshot IS NOT NULL AND balance_snapshot_hash IS NOT NULL)),
      ADD CONSTRAINT chk_writeoff_ledger CHECK(status NOT IN('COMPLETED','REVERSED') OR ledger_transaction_id IS NOT NULL);
    CREATE UNIQUE INDEX uq_completed_writeoff_loan ON public.loan_write_offs(tenant_id,loan_id) WHERE status='COMPLETED';
    ALTER TABLE public.loan_write_off_recoveries ALTER COLUMN amount TYPE bigint USING round(amount*100)::bigint,
      ALTER COLUMN status TYPE varchar(20) USING status::text,
      ADD COLUMN idempotency_key varchar(255), ADD COLUMN request_hash char(64), ADD COLUMN correlation_id uuid, ADD COLUMN causation_id uuid,
      ADD COLUMN source_event_id uuid, ADD COLUMN source_payload_hash char(64), ADD COLUMN allocation_snapshot jsonb,
      ADD COLUMN ledger_idempotency_key varchar(255), ADD COLUMN retention_until date NOT NULL DEFAULT(current_date+2557),
      ADD COLUMN legal_hold boolean NOT NULL DEFAULT false,
      ADD CONSTRAINT uq_recovery_tenant_id UNIQUE(tenant_id,id), ADD CONSTRAINT uq_recovery_idempotency UNIQUE(tenant_id,idempotency_key),
      ADD CONSTRAINT uq_recovery_payment UNIQUE(tenant_id,payment_transaction_id), ADD CONSTRAINT uq_recovery_event UNIQUE(tenant_id,source_event_id),
      ADD CONSTRAINT fk_recovery_writeoff_tenant_v2 FOREIGN KEY(tenant_id,write_off_id) REFERENCES public.loan_write_offs(tenant_id,id),
      ADD CONSTRAINT chk_recovery_ngn CHECK(currency='NGN'), ADD CONSTRAINT chk_recovery_status CHECK(status IN('PENDING','PROCESSING','LEDGER_POSTING','POSTED','FAILED','REVERSED','MANUAL_REVIEW')),
      ADD CONSTRAINT chk_recovery_evidence CHECK(status='PENDING' OR (idempotency_key IS NOT NULL AND request_hash IS NOT NULL AND correlation_id IS NOT NULL AND source_event_id IS NOT NULL AND source_payload_hash IS NOT NULL)),
      ADD CONSTRAINT chk_recovery_ledger CHECK(status NOT IN('POSTED','REVERSED') OR ledger_transaction_id IS NOT NULL);

    CREATE TABLE public.loan_restructure_history(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,restructure_id uuid NOT NULL,previous_status varchar(25),new_status varchar(25) NOT NULL,actor_id uuid,reason_code varchar(100),created_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(tenant_id,restructure_id) REFERENCES public.loan_restructures(tenant_id,id));
    CREATE TABLE public.loan_writeoff_history(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,writeoff_id uuid NOT NULL,previous_status varchar(25),new_status varchar(25) NOT NULL,actor_id uuid,reason_code varchar(100),created_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(tenant_id,writeoff_id) REFERENCES public.loan_write_offs(tenant_id,id));
    CREATE OR REPLACE FUNCTION public.protect_ln08_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Financial lifecycle history is immutable'; END $$;
    CREATE TRIGGER trg_protect_restructure_history BEFORE UPDATE OR DELETE ON public.loan_restructure_history FOR EACH ROW EXECUTE FUNCTION public.protect_ln08_history();
    CREATE TRIGGER trg_protect_writeoff_history BEFORE UPDATE OR DELETE ON public.loan_writeoff_history FOR EACH ROW EXECUTE FUNCTION public.protect_ln08_history();
    CREATE OR REPLACE FUNCTION public.protect_completed_writeoff() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF TG_OP='DELETE' OR OLD.status IN('COMPLETED','REVERSED') THEN RAISE EXCEPTION 'Completed write-off is immutable'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER trg_protect_completed_writeoff BEFORE UPDATE OR DELETE ON public.loan_write_offs FOR EACH ROW EXECUTE FUNCTION public.protect_completed_writeoff();
    CREATE OR REPLACE FUNCTION public.protect_posted_recovery() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF TG_OP='DELETE' OR OLD.status IN('POSTED','REVERSED') THEN RAISE EXCEPTION 'Posted recovery is immutable'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER trg_protect_posted_recovery BEFORE UPDATE OR DELETE ON public.loan_write_off_recoveries FOR EACH ROW EXECUTE FUNCTION public.protect_posted_recovery();
    CREATE INDEX idx_restructure_recovery ON public.loan_restructures(status,requested_at) WHERE status IN('APPROVAL_PENDING','LEDGER_POSTING','MANUAL_REVIEW');
    CREATE INDEX idx_writeoff_recovery ON public.loan_write_offs(status,requested_at) WHERE status IN('APPROVAL_PENDING','LEDGER_POSTING','MANUAL_REVIEW');
    CREATE INDEX idx_post_writeoff_recovery ON public.loan_write_off_recoveries(status,created_at) WHERE status IN('PROCESSING','LEDGER_POSTING','MANUAL_REVIEW');
    ALTER TABLE public.loan_restructure_history ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_restructure_history FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_writeoff_history ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_writeoff_history FORCE ROW LEVEL SECURITY;
    CREATE POLICY restructure_history_tenant_policy ON public.loan_restructure_history USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    CREATE POLICY writeoff_history_tenant_policy ON public.loan_writeoff_history USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    GRANT SELECT,INSERT ON public.loan_restructure_history,public.loan_writeoff_history TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_restructure_history,public.loan_writeoff_history TO parc_lending_readonly;
  `);
}

export function down(): Promise<never> {
  return Promise.reject(new Error("LN-08 controls are forward-only"));
}

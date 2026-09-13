import type { Knex } from "knex";
export const config = { transaction: false };

/** Approved LENDING-DB-01 through LENDING-DB-17. */
export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("loan_product_version_history")) return;
  await knex.raw(`
    ALTER TYPE public.loan_product_type_enum ADD VALUE IF NOT EXISTS 'UNSECURED_PERSONAL';
    ALTER TYPE public.loan_product_type_enum ADD VALUE IF NOT EXISTS 'SALARY_BACKED';
    ALTER TYPE public.loan_product_type_enum ADD VALUE IF NOT EXISTS 'SECURED';
    ALTER TYPE public.loan_product_type_enum ADD VALUE IF NOT EXISTS 'ASSET_FINANCE';
  `);
  await knex.raw(`
    DO $roles$ BEGIN
      IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='parc_lending_runtime') THEN CREATE ROLE parc_lending_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; END IF;
      IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='parc_lending_worker') THEN CREATE ROLE parc_lending_worker NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; END IF;
      IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='parc_lending_readonly') THEN CREATE ROLE parc_lending_readonly NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; END IF;
    END $roles$;
    ALTER TABLE public.loan_products ALTER COLUMN min_amount TYPE bigint USING round(min_amount*100)::bigint, ALTER COLUMN max_amount TYPE bigint USING round(max_amount*100)::bigint, ALTER COLUMN interest_rate TYPE numeric(18,10), ALTER COLUMN min_amount DROP NOT NULL, ALTER COLUMN max_amount DROP NOT NULL, ALTER COLUMN min_tenure_days DROP NOT NULL, ALTER COLUMN max_tenure_days DROP NOT NULL, ALTER COLUMN interest_rate DROP NOT NULL, ALTER COLUMN interest_type DROP NOT NULL, ALTER COLUMN repayment_frequency DROP NOT NULL;
    ALTER TABLE public.loan_product_versions ALTER COLUMN min_amount TYPE bigint USING round(min_amount*100)::bigint, ALTER COLUMN max_amount TYPE bigint USING round(max_amount*100)::bigint, ALTER COLUMN interest_rate TYPE numeric(18,10);
    ALTER TABLE public.loan_product_fees ALTER COLUMN fixed_amount TYPE bigint USING round(fixed_amount*100)::bigint, ALTER COLUMN percentage_rate TYPE numeric(18,10);
    ALTER TABLE public.loan_product_tiers ALTER COLUMN min_amount TYPE bigint USING CASE WHEN min_amount IS NULL THEN NULL ELSE round(min_amount*100)::bigint END, ALTER COLUMN max_amount TYPE bigint USING CASE WHEN max_amount IS NULL THEN NULL ELSE round(max_amount*100)::bigint END, ALTER COLUMN max_total_exposure TYPE bigint USING CASE WHEN max_total_exposure IS NULL THEN NULL ELSE round(max_total_exposure*100)::bigint END, ALTER COLUMN interest_rate TYPE numeric(18,10);

    ALTER TABLE public.loan_products ADD COLUMN lifecycle_status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK(lifecycle_status IN('DRAFT','ACTIVE','RETIRED')), ADD COLUMN idempotency_key varchar(255), ADD COLUMN request_hash char(64), ADD CONSTRAINT uq_loan_product_idempotency UNIQUE(tenant_id,idempotency_key);
    ALTER TABLE public.loan_product_versions ALTER COLUMN published_at DROP DEFAULT, ALTER COLUMN published_at DROP NOT NULL, ADD COLUMN status varchar(30) NOT NULL DEFAULT 'DRAFT' CHECK(status IN('DRAFT','PENDING_APPROVAL','PUBLISHED','RETIRED')), ADD COLUMN approval_id uuid, ADD COLUMN idempotency_key varchar(255), ADD COLUMN request_hash char(64), ADD COLUMN configuration_hash char(64), ADD COLUMN calculation_policy_version varchar(50) NOT NULL DEFAULT 'LENDING_CALC_V1', ADD COLUMN rounding_mode varchar(30) NOT NULL DEFAULT 'HALF_EVEN' CHECK(rounding_mode IN('HALF_EVEN','HALF_UP','DOWN')), ADD COLUMN minor_unit_scale smallint NOT NULL DEFAULT 2 CHECK(minor_unit_scale BETWEEN 0 AND 6), ADD COLUMN calculation_timezone varchar(64) NOT NULL DEFAULT 'Africa/Lagos', ADD COLUMN repayment_grace_period_days integer NOT NULL DEFAULT 0 CHECK(repayment_grace_period_days>=0), ADD COLUMN late_payment_grace_period_days integer NOT NULL DEFAULT 0 CHECK(late_payment_grace_period_days>=0), ADD COLUMN penalty_type varchar(20) CHECK(penalty_type IN('FIXED','PERCENTAGE')), ADD COLUMN penalty_rate numeric(18,10) CHECK(penalty_rate IS NULL OR penalty_rate>=0), ADD COLUMN penalty_fixed_amount bigint CHECK(penalty_fixed_amount IS NULL OR penalty_fixed_amount>=0), ADD COLUMN penalty_cap_amount bigint CHECK(penalty_cap_amount IS NULL OR penalty_cap_amount>=0), ADD COLUMN penalty_frequency varchar(20) CHECK(penalty_frequency IN('ONCE','DAILY','WEEKLY','MONTHLY')), ADD COLUMN penalty_compounds boolean NOT NULL DEFAULT false, ADD COLUMN daily_reducing_enabled boolean NOT NULL DEFAULT false, ADD COLUMN collateral_valuation_ready boolean NOT NULL DEFAULT false, ADD COLUMN insurance_ready boolean NOT NULL DEFAULT false, ADD COLUMN vendor_payment_ready boolean NOT NULL DEFAULT false, ADD COLUMN repossession_ready boolean NOT NULL DEFAULT false, ADD COLUMN legal_process_ready boolean NOT NULL DEFAULT false, ADD COLUMN activated_for_tenant boolean NOT NULL DEFAULT false;
    UPDATE public.loan_product_versions SET status='PUBLISHED',configuration_hash=encode(digest(product_configuration::text||tier_snapshot::text||fee_snapshot::text||rule_snapshot::text,'sha256'),'hex') WHERE published_at IS NOT NULL;
    UPDATE public.loan_product_versions SET configuration_hash=repeat('0',64) WHERE configuration_hash IS NULL;
    ALTER TABLE public.loan_product_versions ALTER COLUMN configuration_hash SET NOT NULL;
    ALTER TABLE public.loan_product_versions ADD CONSTRAINT uq_product_version_idempotency UNIQUE(tenant_id,idempotency_key), ADD CONSTRAINT chk_product_version_ngn_publish CHECK(status<>'PUBLISHED' OR currency='NGN'), ADD CONSTRAINT chk_daily_reducing_activation CHECK(interest_type<>'DAILY_REDUCING_BALANCE' OR daily_reducing_enabled), ADD CONSTRAINT chk_secured_readiness CHECK(status<>'PUBLISHED' OR product_type NOT IN('SECURED','ASSET_FINANCE') OR (requires_collateral AND collateral_valuation_ready AND insurance_ready AND vendor_payment_ready AND repossession_ready AND legal_process_ready)), ADD CONSTRAINT chk_publication_evidence CHECK(status NOT IN('PUBLISHED','RETIRED') OR (approval_id IS NOT NULL AND published_at IS NOT NULL AND published_by IS NOT NULL)), ADD CONSTRAINT chk_penalty_configuration CHECK((penalty_type IS NULL AND penalty_rate IS NULL AND penalty_fixed_amount IS NULL AND penalty_frequency IS NULL) OR (penalty_type='FIXED' AND penalty_fixed_amount IS NOT NULL AND penalty_rate IS NULL AND penalty_frequency IS NOT NULL) OR (penalty_type='PERCENTAGE' AND penalty_rate IS NOT NULL AND penalty_fixed_amount IS NULL AND penalty_frequency IS NOT NULL));
    CREATE UNIQUE INDEX uq_current_published_product_version ON public.loan_product_versions(tenant_id,loan_product_id) WHERE status='PUBLISHED' AND is_current;

    CREATE OR REPLACE FUNCTION public.valid_allocation_order(value jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$ SELECT jsonb_typeof(value)='array' AND jsonb_array_length(value)=4 AND NOT EXISTS(SELECT required FROM unnest(ARRAY['PENALTY','FEES','INTEREST','PRINCIPAL']) required WHERE NOT value @> to_jsonb(ARRAY[required]::text[])) $$;
    UPDATE public.loan_products SET repayment_allocation_order=replace(repayment_allocation_order::text,'"FEE"','"FEES"')::jsonb;
    UPDATE public.loan_product_versions SET repayment_allocation_order=replace(repayment_allocation_order::text,'"FEE"','"FEES"')::jsonb;
    ALTER TABLE public.loan_products ALTER COLUMN repayment_allocation_order SET DEFAULT '["PENALTY","FEES","INTEREST","PRINCIPAL"]'::jsonb;
    ALTER TABLE public.loan_product_versions ADD CONSTRAINT chk_product_version_allocation CHECK(public.valid_allocation_order(repayment_allocation_order));
    ALTER TABLE public.loan_products ADD CONSTRAINT chk_product_allocation CHECK(public.valid_allocation_order(repayment_allocation_order));

    ALTER TABLE public.loan_product_fees ADD CONSTRAINT uq_loan_product_fees_tenant_id UNIQUE(tenant_id,id), ADD CONSTRAINT fk_product_fee_tenant FOREIGN KEY(tenant_id,loan_product_id) REFERENCES public.loan_products(tenant_id,id);
    ALTER TABLE public.loan_product_rules ADD CONSTRAINT uq_loan_product_rules_tenant_id UNIQUE(tenant_id,id), ADD CONSTRAINT fk_product_rule_tenant FOREIGN KEY(tenant_id,loan_product_id) REFERENCES public.loan_products(tenant_id,id);
    ALTER TABLE public.loan_product_tiers ADD CONSTRAINT uq_loan_product_tiers_tenant_id UNIQUE(tenant_id,id), ADD CONSTRAINT fk_product_tier_tenant FOREIGN KEY(tenant_id,loan_product_id) REFERENCES public.loan_products(tenant_id,id);
    ALTER TABLE public.loan_product_versions ADD CONSTRAINT fk_product_version_tenant FOREIGN KEY(tenant_id,loan_product_id) REFERENCES public.loan_products(tenant_id,id);

    CREATE TABLE public.loan_product_version_history(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,loan_product_id uuid NOT NULL,product_version_id uuid NOT NULL,previous_status varchar(30),new_status varchar(30) NOT NULL,approval_id uuid,actor_id uuid,reason text,created_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(tenant_id,loan_product_id) REFERENCES public.loan_products(tenant_id,id),FOREIGN KEY(tenant_id,product_version_id) REFERENCES public.loan_product_versions(tenant_id,id));
    CREATE OR REPLACE FUNCTION public.protect_published_product_version() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF TG_OP='DELETE' AND OLD.status IN('PUBLISHED','RETIRED') THEN RAISE EXCEPTION 'Published product versions are immutable'; END IF; IF TG_OP='UPDATE' AND OLD.status='RETIRED' THEN RAISE EXCEPTION 'Retired product versions are immutable'; END IF; IF TG_OP='UPDATE' AND OLD.status='PUBLISHED' AND NOT(NEW.status='RETIRED' AND NEW.is_current=false AND (to_jsonb(NEW)-ARRAY['status','is_current','effective_to']::text[])=(to_jsonb(OLD)-ARRAY['status','is_current','effective_to']::text[])) THEN RAISE EXCEPTION 'Published product versions are immutable'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER trg_protect_published_product_version BEFORE UPDATE OR DELETE ON public.loan_product_versions FOR EACH ROW EXECUTE FUNCTION public.protect_published_product_version();
    CREATE OR REPLACE FUNCTION public.record_product_version_status() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF TG_OP='INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN INSERT INTO public.loan_product_version_history(tenant_id,loan_product_id,product_version_id,previous_status,new_status,approval_id,actor_id) VALUES(NEW.tenant_id,NEW.loan_product_id,NEW.id,CASE WHEN TG_OP='INSERT' THEN NULL ELSE OLD.status END,NEW.status,NEW.approval_id,NEW.published_by); END IF; RETURN NEW; END $$;
    CREATE TRIGGER trg_record_product_version_status AFTER INSERT OR UPDATE OF status ON public.loan_product_versions FOR EACH ROW EXECUTE FUNCTION public.record_product_version_status();
    CREATE OR REPLACE FUNCTION public.protect_product_version_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Product version history is immutable'; END $$;
    CREATE TRIGGER trg_protect_product_version_history BEFORE UPDATE OR DELETE ON public.loan_product_version_history FOR EACH ROW EXECUTE FUNCTION public.protect_product_version_history();
    ALTER TABLE public.loan_outbox_events ADD COLUMN event_version integer NOT NULL DEFAULT 1 CHECK(event_version>0), ADD COLUMN idempotency_key varchar(255), ADD COLUMN correlation_id uuid, ADD CONSTRAINT uq_loan_outbox_idempotency UNIQUE(tenant_id,idempotency_key);

    ALTER TABLE public.loan_product_version_history ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_product_version_history FORCE ROW LEVEL SECURITY;
    CREATE POLICY product_version_history_tenant_policy ON public.loan_product_version_history USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    DO $rls$ DECLARE r record; BEGIN FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid AND a.attname='tenant_id' WHERE n.nspname='public' AND c.relkind='r' LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',r.relname); EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',r.relname); END LOOP; END $rls$;
    GRANT USAGE ON SCHEMA public TO parc_lending_runtime,parc_lending_worker,parc_lending_readonly;
    GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA public TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO parc_lending_readonly;
    GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO parc_lending_runtime,parc_lending_worker;
  `);
}
export function down(): Promise<never> {
  return Promise.reject(new Error("LN-01 product controls are forward-only"));
}

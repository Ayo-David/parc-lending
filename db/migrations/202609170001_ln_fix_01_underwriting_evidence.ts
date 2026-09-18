import type { Knex } from "knex";

/** Approved LENDING-DB-132 through LENDING-DB-136. */
export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("loan_underwriting_evidence_snapshots"))
    return;
  await knex.raw(`
    ALTER TABLE public.loan_applications
      ADD COLUMN underwriting_status varchar(30) NOT NULL DEFAULT 'PENDING_EVIDENCE'
        CHECK (underwriting_status IN ('PENDING_EVIDENCE','COLLECTING_EVIDENCE','READY','ACTION_REQUIRED','MANUAL_REVIEW','COMPLETED','FAILED')),
      ADD COLUMN declared_monthly_income_minor bigint CHECK (declared_monthly_income_minor IS NULL OR declared_monthly_income_minor >= 0),
      ADD COLUMN declared_income_source varchar(30) CHECK (declared_income_source IS NULL OR declared_income_source IN ('CUSTOMER_DECLARED','PROFILE_DECLARED')),
      ADD COLUMN income_verification_status varchar(30) CHECK (income_verification_status IS NULL OR income_verification_status IN ('UNVERIFIED','VERIFIED','STALE'));

    CREATE TABLE public.loan_underwriting_evidence_snapshots (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      application_id uuid NOT NULL,
      snapshot_version integer NOT NULL CHECK (snapshot_version > 0),
      collection_status varchar(30) NOT NULL CHECK (collection_status IN ('COLLECTING','READY','ACTION_REQUIRED','FAILED')),
      kyc_tier varchar(50),
      kyc_status varchar(30),
      kyc_verification_reference varchar(255),
      risk_disposition varchar(20) CHECK (risk_disposition IS NULL OR risk_disposition IN ('CLEAR','REFER','BLOCK')),
      risk_reason_codes jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(risk_reason_codes) = 'array'),
      consent_reference varchar(255),
      consent_valid boolean,
      declared_monthly_income_minor bigint CHECK (declared_monthly_income_minor IS NULL OR declared_monthly_income_minor >= 0),
      verified_monthly_income_minor bigint CHECK (verified_monthly_income_minor IS NULL OR verified_monthly_income_minor >= 0),
      income_source varchar(40) CHECK (income_source IS NULL OR income_source IN ('CUSTOMER_DECLARED','PROFILE_DECLARED','SALARY_HISTORY','BANK_STATEMENT','EMPLOYER_VERIFIED','OPEN_BANKING','MANUAL_UNDERWRITING')),
      income_verification_status varchar(30) CHECK (income_verification_status IS NULL OR income_verification_status IN ('UNVERIFIED','VERIFIED','STALE')),
      existing_exposure_minor bigint CHECK (existing_exposure_minor IS NULL OR existing_exposure_minor >= 0),
      active_loan_count integer CHECK (active_loan_count IS NULL OR active_loan_count >= 0),
      maximum_days_past_due integer CHECK (maximum_days_past_due IS NULL OR maximum_days_past_due >= 0),
      observed_at timestamptz,
      expires_at timestamptz,
      snapshot_hash char(64),
      failure_code varchar(100),
      failure_detail text,
      collected_at timestamptz,
      retain_until timestamptz NOT NULL DEFAULT (now() + interval '7 years'),
      legal_hold boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, application_id, snapshot_version),
      UNIQUE (tenant_id, id),
      FOREIGN KEY (tenant_id, application_id) REFERENCES public.loan_applications(tenant_id, id),
      CHECK (expires_at IS NULL OR observed_at IS NULL OR expires_at > observed_at),
      CHECK (collection_status <> 'READY' OR (kyc_status IS NOT NULL AND risk_disposition IS NOT NULL AND consent_valid = true AND existing_exposure_minor IS NOT NULL AND active_loan_count IS NOT NULL AND snapshot_hash IS NOT NULL AND collected_at IS NOT NULL))
    );

    CREATE TABLE public.loan_underwriting_evidence_sources (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      snapshot_id uuid NOT NULL,
      application_id uuid NOT NULL,
      evidence_type varchar(50) NOT NULL CHECK (evidence_type IN ('KYC','IDENTITY_RISK','CONSENT','INCOME','LENDING_EXPOSURE','DELINQUENCY')),
      source_service varchar(100) NOT NULL,
      source_reference varchar(255) NOT NULL,
      source_version varchar(100) NOT NULL,
      outcome varchar(20) NOT NULL CHECK (outcome IN ('AVAILABLE','UNAVAILABLE','STALE','BLOCKED')),
      normalized_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
      payload_hash char(64) NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'),
      observed_at timestamptz NOT NULL,
      expires_at timestamptz,
      retain_until timestamptz NOT NULL DEFAULT (now() + interval '7 years'),
      legal_hold boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (snapshot_id, evidence_type, source_service),
      FOREIGN KEY (tenant_id, snapshot_id) REFERENCES public.loan_underwriting_evidence_snapshots(tenant_id, id),
      FOREIGN KEY (tenant_id, application_id) REFERENCES public.loan_applications(tenant_id, id),
      CHECK (expires_at IS NULL OR expires_at > observed_at)
    );

    ALTER TABLE public.loan_applications ADD COLUMN latest_underwriting_snapshot_id uuid;
    ALTER TABLE public.loan_applications ADD CONSTRAINT fk_application_underwriting_snapshot
      FOREIGN KEY (tenant_id, latest_underwriting_snapshot_id)
      REFERENCES public.loan_underwriting_evidence_snapshots(tenant_id, id);

    CREATE INDEX idx_underwriting_snapshot_collection ON public.loan_underwriting_evidence_snapshots(tenant_id, collection_status, created_at);
    CREATE INDEX idx_underwriting_source_application ON public.loan_underwriting_evidence_sources(tenant_id, application_id, evidence_type);

    CREATE OR REPLACE FUNCTION public.protect_underwriting_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'underwriting evidence is immutable' USING ERRCODE='55000'; END IF;
      IF OLD.collection_status IN ('READY','ACTION_REQUIRED','FAILED') THEN
        RAISE EXCEPTION 'completed underwriting evidence is immutable' USING ERRCODE='55000';
      END IF;
      RETURN NEW;
    END $$;
    CREATE OR REPLACE FUNCTION public.reject_underwriting_source_change() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'underwriting evidence sources are immutable' USING ERRCODE='55000';
    END $$;
    CREATE TRIGGER trg_protect_underwriting_snapshot BEFORE UPDATE OR DELETE ON public.loan_underwriting_evidence_snapshots
      FOR EACH ROW EXECUTE FUNCTION public.protect_underwriting_evidence();
    CREATE TRIGGER trg_protect_underwriting_source BEFORE UPDATE OR DELETE ON public.loan_underwriting_evidence_sources
      FOR EACH ROW EXECUTE FUNCTION public.reject_underwriting_source_change();

    ALTER TABLE public.loan_underwriting_evidence_snapshots ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_underwriting_evidence_snapshots FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_underwriting_evidence_sources ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_underwriting_evidence_sources FORCE ROW LEVEL SECURITY;
    CREATE POLICY underwriting_snapshot_tenant_policy ON public.loan_underwriting_evidence_snapshots
      USING (tenant_id = public.current_tenant_uuid()) WITH CHECK (tenant_id = public.current_tenant_uuid());
    CREATE POLICY underwriting_source_tenant_policy ON public.loan_underwriting_evidence_sources
      USING (tenant_id = public.current_tenant_uuid()) WITH CHECK (tenant_id = public.current_tenant_uuid());

    GRANT SELECT,INSERT,UPDATE ON public.loan_underwriting_evidence_snapshots TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT,INSERT ON public.loan_underwriting_evidence_sources TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_underwriting_evidence_snapshots,public.loan_underwriting_evidence_sources TO parc_lending_readonly;
  `);
}

export function down(): Promise<never> {
  return Promise.reject(
    new Error("Underwriting evidence provenance is forward-only"),
  );
}

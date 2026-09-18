import type { Knex } from "knex";

export const config = { transaction: false };

/** Approved LENDING-DB-33 through LENDING-DB-44. */
export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("loan_manual_review_cases")) return;
  await knex.raw(`
    CREATE TABLE public.loan_manual_review_cases(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
      application_id uuid NOT NULL, status varchar(30) NOT NULL DEFAULT 'OPEN'
        CHECK(status IN('OPEN','ASSIGNED','PENDING_APPROVAL','DECIDED','CANCELLED')),
      assigned_reviewer_id uuid, assigned_at timestamptz, lease_expires_at timestamptz,
      lock_version integer NOT NULL DEFAULT 0 CHECK(lock_version>=0),
      required_authority_level integer NOT NULL CHECK(required_authority_level>0),
      opened_reason_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
      opened_at timestamptz NOT NULL DEFAULT now(), decided_at timestamptz,
      cancelled_at timestamptz, retention_until date NOT NULL DEFAULT (current_date + 2557),
      legal_hold boolean NOT NULL DEFAULT false,
      UNIQUE(tenant_id,id), FOREIGN KEY(tenant_id,application_id)
        REFERENCES public.loan_applications(tenant_id,id)
    );
    CREATE UNIQUE INDEX uq_active_manual_review ON public.loan_manual_review_cases(tenant_id,application_id)
      WHERE status IN('OPEN','ASSIGNED','PENDING_APPROVAL');
    CREATE INDEX idx_manual_review_queue ON public.loan_manual_review_cases(tenant_id,status,lease_expires_at,opened_at);

    CREATE TABLE public.loan_manual_review_recommendations(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
      review_case_id uuid NOT NULL, application_id uuid NOT NULL, reviewer_id uuid NOT NULL,
      recommendation public.loan_decision_enum NOT NULL,
      proposed_amount bigint, proposed_tenure_days integer,
      proposed_interest_rate numeric(18,10), currency char(3) NOT NULL DEFAULT 'NGN',
      reason_codes jsonb NOT NULL, evidence_references jsonb NOT NULL DEFAULT '[]'::jsonb,
      comments text, policy_version varchar(100) NOT NULL, request_hash char(64) NOT NULL,
      idempotency_key varchar(255) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
      retention_until date NOT NULL DEFAULT (current_date + 2557), legal_hold boolean NOT NULL DEFAULT false,
      CHECK(currency~'^[A-Z]{3}$'), CHECK(currency='NGN'),
      CHECK(jsonb_typeof(reason_codes)='array' AND jsonb_array_length(reason_codes)>0),
      CHECK(jsonb_typeof(evidence_references)='array'),
      CHECK(recommendation NOT IN('APPROVED','CONDITIONAL_APPROVAL') OR
        (proposed_amount>0 AND proposed_tenure_days>0 AND proposed_interest_rate>=0)),
      UNIQUE(tenant_id,id), UNIQUE(tenant_id,idempotency_key),
      FOREIGN KEY(tenant_id,review_case_id) REFERENCES public.loan_manual_review_cases(tenant_id,id),
      FOREIGN KEY(tenant_id,application_id) REFERENCES public.loan_applications(tenant_id,id)
    );
    CREATE INDEX idx_manual_recommendation_case ON public.loan_manual_review_recommendations(tenant_id,review_case_id,created_at DESC);

    CREATE TABLE public.loan_manual_decision_conditions(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
      recommendation_id uuid NOT NULL, condition_code varchar(100) NOT NULL,
      description text NOT NULL, status varchar(20) NOT NULL DEFAULT 'PENDING'
        CHECK(status IN('PENDING','SATISFIED','WAIVED')),
      evidence_reference varchar(255), satisfied_by uuid, satisfied_at timestamptz,
      waiver_approval_id uuid, waiver_payload_hash char(64), created_at timestamptz NOT NULL DEFAULT now(),
      retention_until date NOT NULL DEFAULT (current_date + 2557), legal_hold boolean NOT NULL DEFAULT false,
      UNIQUE(tenant_id,id), UNIQUE(tenant_id,recommendation_id,condition_code),
      FOREIGN KEY(tenant_id,recommendation_id) REFERENCES public.loan_manual_review_recommendations(tenant_id,id),
      CHECK(status<>'SATISFIED' OR (evidence_reference IS NOT NULL AND satisfied_by IS NOT NULL AND satisfied_at IS NOT NULL)),
      CHECK(status<>'WAIVED' OR (waiver_approval_id IS NOT NULL AND waiver_payload_hash IS NOT NULL))
    );

    ALTER TABLE public.loan_application_decisions
      ADD COLUMN review_case_id uuid, ADD COLUMN recommendation_id uuid,
      ADD COLUMN approval_action varchar(100), ADD COLUMN approval_resource_type varchar(100),
      ADD COLUMN approval_resource_id uuid, ADD COLUMN approval_payload_hash char(64),
      ADD COLUMN approval_consumed_at timestamptz, ADD COLUMN approval_checker_ids jsonb,
      ADD COLUMN required_authority_level integer, ADD COLUMN approved_authority_level integer,
      ADD COLUMN idempotency_key varchar(255), ADD COLUMN correlation_id uuid,
      ADD CONSTRAINT fk_manual_decision_case FOREIGN KEY(tenant_id,review_case_id)
        REFERENCES public.loan_manual_review_cases(tenant_id,id),
      ADD CONSTRAINT fk_manual_decision_recommendation FOREIGN KEY(tenant_id,recommendation_id)
        REFERENCES public.loan_manual_review_recommendations(tenant_id,id),
      ADD CONSTRAINT chk_manual_decision_approval CHECK(decision_source<>'MANUAL' OR
        (review_case_id IS NOT NULL AND recommendation_id IS NOT NULL AND approval_id IS NOT NULL
         AND approval_action='MANUAL_LOAN_APPROVAL' AND approval_resource_type='loan_manual_review_case'
         AND approval_resource_id=review_case_id AND approval_payload_hash IS NOT NULL
         AND approval_consumed_at IS NOT NULL AND jsonb_array_length(approval_checker_ids)>0
         AND required_authority_level>0 AND approved_authority_level>=required_authority_level
         AND idempotency_key IS NOT NULL AND correlation_id IS NOT NULL));
    CREATE UNIQUE INDEX uq_manual_decision_application ON public.loan_application_decisions(tenant_id,application_id)
      WHERE decision_source='MANUAL';
    CREATE UNIQUE INDEX uq_manual_decision_idempotency ON public.loan_application_decisions(tenant_id,idempotency_key)
      WHERE idempotency_key IS NOT NULL;

    ALTER TABLE public.loan_application_reviews ADD CONSTRAINT uq_application_review_tenant_id UNIQUE(tenant_id,id);

    CREATE OR REPLACE FUNCTION public.protect_manual_underwriting_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'Manual underwriting evidence is immutable'; END $$;
    CREATE TRIGGER trg_protect_manual_recommendation BEFORE UPDATE OR DELETE ON public.loan_manual_review_recommendations
      FOR EACH ROW EXECUTE FUNCTION public.protect_manual_underwriting_evidence();
    CREATE OR REPLACE FUNCTION public.protect_decided_manual_case() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF TG_OP='DELETE' OR OLD.status IN('DECIDED','CANCELLED') THEN
        RAISE EXCEPTION 'Completed manual review is immutable'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER trg_protect_decided_manual_case BEFORE UPDATE OR DELETE ON public.loan_manual_review_cases
      FOR EACH ROW EXECUTE FUNCTION public.protect_decided_manual_case();
    CREATE OR REPLACE FUNCTION public.validate_manual_decision_separation() RETURNS trigger LANGUAGE plpgsql AS $$
      DECLARE reviewer uuid; checker text;
      BEGIN IF NEW.decision_source='MANUAL' THEN
        SELECT reviewer_id INTO reviewer FROM public.loan_manual_review_recommendations
          WHERE tenant_id=NEW.tenant_id AND id=NEW.recommendation_id;
        IF reviewer IS NULL OR reviewer=NEW.decided_by THEN RAISE EXCEPTION 'Reviewer cannot execute their recommendation'; END IF;
        FOR checker IN SELECT jsonb_array_elements_text(NEW.approval_checker_ids) LOOP
          IF checker::uuid=reviewer OR checker::uuid=NEW.decided_by THEN
            RAISE EXCEPTION 'Manual decision maker-checker separation violated'; END IF;
        END LOOP;
      END IF; RETURN NEW; END $$;
    CREATE TRIGGER trg_validate_manual_decision_separation BEFORE INSERT ON public.loan_application_decisions
      FOR EACH ROW EXECUTE FUNCTION public.validate_manual_decision_separation();

    CREATE OR REPLACE FUNCTION public.validate_application_transition() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.status IS DISTINCT FROM OLD.status AND NOT(
        (OLD.status='DRAFT' AND NEW.status='SUBMITTED') OR
        (OLD.status='SUBMITTED' AND NEW.status='ELIGIBILITY_CHECK') OR
        (OLD.status='ELIGIBILITY_CHECK' AND NEW.status IN('APPROVED','REJECTED','UNDER_REVIEW')) OR
        (OLD.status='UNDER_REVIEW' AND NEW.status IN('APPROVED','REJECTED')) OR
        (OLD.status IN('SUBMITTED','ELIGIBILITY_CHECK','UNDER_REVIEW') AND NEW.status='CANCELLED'))
      THEN RAISE EXCEPTION 'Invalid loan application transition'; END IF;
      IF OLD.status='UNDER_REVIEW' AND NEW.status IN('APPROVED','REJECTED') AND NOT EXISTS(
        SELECT 1 FROM public.loan_application_decisions d WHERE d.tenant_id=NEW.tenant_id
          AND d.application_id=NEW.id AND d.decision_source='MANUAL' AND d.decision=NEW.status::text::public.loan_decision_enum)
      THEN RAISE EXCEPTION 'Final manual decision required'; END IF;
      IF TG_OP='UPDATE' AND (NEW.tenant_id,NEW.customer_id,NEW.loan_product_id,NEW.loan_product_version_id,
        NEW.requested_amount,NEW.requested_tenure_days,NEW.currency,NEW.idempotency_key,NEW.request_hash,
        NEW.product_configuration_hash,NEW.consent_reference) IS DISTINCT FROM
        (OLD.tenant_id,OLD.customer_id,OLD.loan_product_id,OLD.loan_product_version_id,
        OLD.requested_amount,OLD.requested_tenure_days,OLD.currency,OLD.idempotency_key,OLD.request_hash,
        OLD.product_configuration_hash,OLD.consent_reference)
      THEN RAISE EXCEPTION 'Application submission evidence is immutable'; END IF; RETURN NEW; END $$;

    ALTER TABLE public.loan_manual_review_cases ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_manual_review_cases FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_manual_review_recommendations ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_manual_review_recommendations FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_manual_decision_conditions ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_manual_decision_conditions FORCE ROW LEVEL SECURITY;
    CREATE POLICY manual_case_tenant_policy ON public.loan_manual_review_cases USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    CREATE POLICY manual_recommendation_tenant_policy ON public.loan_manual_review_recommendations USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    CREATE POLICY manual_condition_tenant_policy ON public.loan_manual_decision_conditions USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    GRANT SELECT,INSERT,UPDATE ON public.loan_manual_review_cases TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT,INSERT ON public.loan_manual_review_recommendations TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT,INSERT,UPDATE ON public.loan_manual_decision_conditions TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_manual_review_cases,public.loan_manual_review_recommendations,public.loan_manual_decision_conditions TO parc_lending_readonly;
  `);
}

export function down(): Promise<never> {
  return Promise.reject(
    new Error("LN-03 manual underwriting controls are forward-only"),
  );
}

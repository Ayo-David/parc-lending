import type { Knex } from "knex";

export const config = { transaction: false };

/**
 * Review fixes for databases where LN-08 and LN-FIX-01 already ran (or were
 * skipped because the baseline snapshot already contains their tables).
 */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DO $roles$ BEGIN
      IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='parc_lending_runtime') THEN CREATE ROLE parc_lending_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; END IF;
      IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='parc_lending_worker') THEN CREATE ROLE parc_lending_worker NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; END IF;
      IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='parc_lending_readonly') THEN CREATE ROLE parc_lending_readonly NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; END IF;
    END $roles$;

    -- Neither the maker nor the executor may appear among the checkers, and they must differ.
    ALTER TABLE public.loan_adjustments DROP CONSTRAINT IF EXISTS chk_adjustment_approval;
    ALTER TABLE public.loan_adjustments ADD CONSTRAINT chk_adjustment_approval CHECK(approval_id IS NOT NULL AND approval_payload_hash IS NOT NULL AND approval_consumed_at IS NOT NULL AND approval_maker_id IS NOT NULL AND jsonb_array_length(approval_checker_ids)>0 AND executor_id IS NOT NULL AND executor_id<>approval_maker_id AND NOT jsonb_exists(approval_checker_ids,approval_maker_id::text) AND NOT jsonb_exists(approval_checker_ids,executor_id::text));

    -- Restore the shared rule/decision guard that LN-FIX-01 replaced; snapshots get their own function.
    CREATE OR REPLACE FUNCTION public.protect_underwriting_evidence() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Underwriting evidence is immutable'; END $$;
    CREATE OR REPLACE FUNCTION public.protect_underwriting_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'underwriting evidence is immutable' USING ERRCODE='55000'; END IF;
      IF OLD.collection_status IN ('READY','ACTION_REQUIRED','FAILED') THEN
        RAISE EXCEPTION 'completed underwriting evidence is immutable' USING ERRCODE='55000';
      END IF;
      RETURN NEW;
    END $$;
    DROP TRIGGER IF EXISTS trg_protect_underwriting_snapshot ON public.loan_underwriting_evidence_snapshots;
    CREATE TRIGGER trg_protect_underwriting_snapshot BEFORE UPDATE OR DELETE ON public.loan_underwriting_evidence_snapshots
      FOR EACH ROW EXECUTE FUNCTION public.protect_underwriting_snapshot();

    -- A repayment quote can back at most one repayment request.
    CREATE UNIQUE INDEX IF NOT EXISTS uq_repayment_request_quote ON public.loan_repayment_requests(tenant_id,repayment_quote_id);

    -- At most one in-flight disbursement per loan.
    CREATE UNIQUE INDEX IF NOT EXISTS uq_inflight_disbursement_per_loan ON public.loan_disbursements(tenant_id,loan_id)
      WHERE status IN('CREATED','APPROVAL_PENDING','LEDGER_POSTING','PAYMENT_SUBMITTING','PENDING','COMPENSATING','MANUAL_REVIEW');

    -- A conditional approval whose conditions are all satisfied or waived may finalize as APPROVED.
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
          AND d.application_id=NEW.id AND d.decision_source='MANUAL' AND (
            d.decision=NEW.status::text::public.loan_decision_enum OR
            (NEW.status='APPROVED' AND d.decision='CONDITIONAL_APPROVAL' AND NOT EXISTS(
              SELECT 1 FROM public.loan_manual_decision_conditions c
              WHERE c.tenant_id=d.tenant_id AND c.recommendation_id=d.recommendation_id AND c.status='PENDING'))))
      THEN RAISE EXCEPTION 'Final manual decision required'; END IF;
      IF TG_OP='UPDATE' AND (NEW.tenant_id,NEW.customer_id,NEW.loan_product_id,NEW.loan_product_version_id,
        NEW.requested_amount,NEW.requested_tenure_days,NEW.currency,NEW.idempotency_key,NEW.request_hash,
        NEW.product_configuration_hash,NEW.consent_reference) IS DISTINCT FROM
        (OLD.tenant_id,OLD.customer_id,OLD.loan_product_id,OLD.loan_product_version_id,
        OLD.requested_amount,OLD.requested_tenure_days,OLD.currency,OLD.idempotency_key,OLD.request_hash,
        OLD.product_configuration_hash,OLD.consent_reference)
      THEN RAISE EXCEPTION 'Application submission evidence is immutable'; END IF; RETURN NEW; END $$;

    -- Servicing replays compare the caller's command, not values derived from current balances.
    ALTER TABLE public.loan_interest_accruals ADD COLUMN IF NOT EXISTS request_hash char(64);
    ALTER TABLE public.loan_penalty_assessments ADD COLUMN IF NOT EXISTS request_hash char(64);
  `);
}

export function down(): Promise<never> {
  return Promise.reject(new Error("LN-FIX-02 controls are forward-only"));
}

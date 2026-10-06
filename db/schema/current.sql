--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: accrual_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.accrual_status_enum AS ENUM (
    'PENDING',
    'POSTING',
    'POSTED',
    'REVERSED',
    'FAILED'
);


--
-- Name: adjustment_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.adjustment_type_enum AS ENUM (
    'FEE_WAIVER',
    'INTEREST_WAIVER',
    'PENALTY_WAIVER',
    'PRINCIPAL_ADJUSTMENT',
    'INTEREST_ADJUSTMENT',
    'OTHER'
);


--
-- Name: application_review_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.application_review_type_enum AS ENUM (
    'AUTOMATED',
    'MANUAL',
    'CREDIT_OFFICER',
    'ADMIN'
);


--
-- Name: asset_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.asset_status_enum AS ENUM (
    'PROPOSED',
    'APPROVED',
    'PURCHASED',
    'DELIVERED',
    'ACTIVE',
    'REPOSSESSED',
    'SOLD',
    'COMPLETED'
);


--
-- Name: collateral_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.collateral_status_enum AS ENUM (
    'PENDING',
    'VERIFIED',
    'ACTIVE',
    'RELEASED',
    'LIQUIDATED',
    'REJECTED'
);


--
-- Name: collateral_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.collateral_type_enum AS ENUM (
    'VEHICLE',
    'EQUIPMENT',
    'PROPERTY',
    'INVENTORY',
    'SECURITY',
    'OTHER'
);


--
-- Name: collection_channel_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.collection_channel_enum AS ENUM (
    'PHONE',
    'SMS',
    'EMAIL',
    'PUSH_NOTIFICATION',
    'FIELD_AGENT',
    'LEGAL',
    'SYSTEM'
);


--
-- Name: disbursement_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.disbursement_status_enum AS ENUM (
    'PENDING',
    'PROCESSING',
    'SUCCESSFUL',
    'FAILED',
    'REVERSED'
);


--
-- Name: fee_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fee_type_enum AS ENUM (
    'ORIGINATION',
    'PROCESSING',
    'INSURANCE',
    'LATE_PAYMENT',
    'EARLY_REPAYMENT',
    'LEGAL',
    'OTHER'
);


--
-- Name: inbox_event_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.inbox_event_status_enum AS ENUM (
    'RECEIVED',
    'PROCESSING',
    'PROCESSED',
    'FAILED',
    'DEAD_LETTERED'
);


--
-- Name: installment_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.installment_status_enum AS ENUM (
    'PENDING',
    'PARTIALLY_PAID',
    'PAID',
    'OVERDUE',
    'WAIVED',
    'CANCELLED'
);


--
-- Name: interest_payment_method_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.interest_payment_method_enum AS ENUM (
    'UPFRONT',
    'AMORTIZED',
    'AT_MATURITY'
);


--
-- Name: interest_rate_period_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.interest_rate_period_enum AS ENUM (
    'DAILY',
    'MONTHLY',
    'ANNUAL',
    'TENURE'
);


--
-- Name: interest_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.interest_type_enum AS ENUM (
    'FLAT',
    'REDUCING_BALANCE',
    'DAILY_REDUCING_BALANCE'
);


--
-- Name: lending_ledger_event_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lending_ledger_event_type_enum AS ENUM (
    'LOAN_DISBURSEMENT',
    'LOAN_REPAYMENT',
    'LOAN_FEE',
    'LOAN_PENALTY',
    'LOAN_INTEREST_ACCRUAL',
    'LOAN_INTEREST_REVERSAL',
    'LOAN_REPAYMENT_REVERSAL',
    'LOAN_DISBURSEMENT_REVERSAL',
    'LOAN_WRITE_OFF',
    'LOAN_WRITE_OFF_REVERSAL',
    'LOAN_REFUND',
    'LOAN_ADJUSTMENT'
);


--
-- Name: lending_ledger_posting_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lending_ledger_posting_status_enum AS ENUM (
    'PENDING',
    'PUBLISHED',
    'PROCESSING',
    'POSTED',
    'FAILED',
    'REJECTED'
);


--
-- Name: loan_application_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.loan_application_status_enum AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'ELIGIBILITY_CHECK',
    'CREDIT_ASSESSMENT',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
    'EXPIRED'
);


--
-- Name: loan_contract_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.loan_contract_status_enum AS ENUM (
    'PENDING_SIGNATURE',
    'SIGNED',
    'ACTIVE',
    'TERMINATED',
    'COMPLETED',
    'VOIDED'
);


--
-- Name: loan_decision_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.loan_decision_enum AS ENUM (
    'APPROVED',
    'REJECTED',
    'REFER',
    'CONDITIONAL_APPROVAL'
);


--
-- Name: loan_offer_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.loan_offer_status_enum AS ENUM (
    'DRAFT',
    'ISSUED',
    'ACCEPTED',
    'DECLINED',
    'EXPIRED',
    'WITHDRAWN',
    'SUPERSEDED'
);


--
-- Name: loan_product_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.loan_product_type_enum AS ENUM (
    'INSTANT',
    'PERSONAL',
    'BUSINESS',
    'ASSET_FINANCING',
    'SALARY',
    'UNSECURED_PERSONAL',
    'SALARY_BACKED',
    'SECURED',
    'ASSET_FINANCE'
);


--
-- Name: loan_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.loan_status_enum AS ENUM (
    'APPROVED',
    'PENDING_DISBURSEMENT',
    'PARTIALLY_DISBURSED',
    'DISBURSED',
    'ACTIVE',
    'OVERDUE',
    'RESTRUCTURED',
    'WRITTEN_OFF',
    'SETTLED',
    'CLOSED',
    'CANCELLED'
);


--
-- Name: mandate_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mandate_status_enum AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'CANCELLED',
    'EXPIRED',
    'FAILED'
);


--
-- Name: party_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.party_role_enum AS ENUM (
    'BORROWER',
    'CO_BORROWER',
    'GUARANTOR'
);


--
-- Name: repayment_frequency_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.repayment_frequency_enum AS ENUM (
    'DAILY',
    'WEEKLY',
    'BIWEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'BULLET'
);


--
-- Name: repayment_method_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.repayment_method_enum AS ENUM (
    'BANK_TRANSFER',
    'DIRECT_DEBIT',
    'CARD',
    'WALLET',
    'CASH',
    'PAYMENT_LINK',
    'INTERNAL_ACCOUNT'
);


--
-- Name: repayment_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.repayment_status_enum AS ENUM (
    'PENDING',
    'PROCESSING',
    'SUCCESSFUL',
    'FAILED',
    'REVERSED',
    'REFUNDED'
);


--
-- Name: restructure_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.restructure_status_enum AS ENUM (
    'REQUESTED',
    'APPROVED',
    'REJECTED',
    'IMPLEMENTED',
    'CANCELLED'
);


--
-- Name: writeoff_recovery_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.writeoff_recovery_status_enum AS ENUM (
    'PENDING',
    'PROCESSING',
    'POSTED',
    'FAILED',
    'REVERSED'
);


--
-- Name: writeoff_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.writeoff_status_enum AS ENUM (
    'PENDING',
    'APPROVED',
    'COMPLETED',
    'REVERSED'
);


--
-- Name: current_tenant_uuid(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_tenant_uuid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
    SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
$$;


--
-- Name: protect_application_events(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_application_events() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN RAISE EXCEPTION 'Application lifecycle history is immutable'; END $$;


--
-- Name: protect_completed_evaluation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_completed_evaluation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF TG_OP='DELETE' OR OLD.status IN('COMPLETED','DEAD_LETTERED') THEN RAISE EXCEPTION 'Completed underwriting evaluation is immutable'; END IF; RETURN NEW; END $$;


--
-- Name: protect_completed_writeoff(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_completed_writeoff() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE recovery_delta bigint;
    BEGIN
      IF TG_OP='DELETE' THEN
        RAISE EXCEPTION 'Completed write-off is immutable';
      END IF;
      recovery_delta := NEW.recovered_amount-OLD.recovered_amount;
      IF OLD.status='COMPLETED'
         AND NEW.status='COMPLETED'
         AND recovery_delta>0
         AND NEW.recovered_amount<=OLD.total_amount
         AND (to_jsonb(NEW)-'recovered_amount')=(to_jsonb(OLD)-'recovered_amount')
         AND NEW.recovered_amount=(
           SELECT COALESCE(sum(r.amount),0) FROM public.loan_write_off_recoveries r
           WHERE r.tenant_id=OLD.tenant_id AND r.write_off_id=OLD.id AND r.status='POSTED'
         ) THEN
        RETURN NEW;
      END IF;
      IF OLD.status IN('COMPLETED','REVERSED') THEN
        RAISE EXCEPTION 'Completed write-off is immutable';
      END IF;
      RETURN NEW;
    END $$;


--
-- Name: protect_customer_quote_evidence(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_customer_quote_evidence() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN RAISE EXCEPTION 'Customer lending quote evidence is immutable'; END $$;


--
-- Name: protect_decided_manual_case(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_decided_manual_case() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN IF TG_OP='DELETE' OR OLD.status IN('DECIDED','CANCELLED') THEN
        RAISE EXCEPTION 'Completed manual review is immutable'; END IF; RETURN NEW; END $$;


--
-- Name: protect_delinquency_assessment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_delinquency_assessment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN RAISE EXCEPTION 'Delinquency assessment is immutable'; END $$;


--
-- Name: protect_disbursement_step(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_disbursement_step() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF TG_OP='DELETE' OR OLD.status IN('SUCCEEDED','FAILED','AMBIGUOUS') THEN RAISE EXCEPTION 'Completed saga evidence is immutable'; END IF; RETURN NEW; END $$;


--
-- Name: protect_final_repayment_batch(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_final_repayment_batch() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF TG_OP='DELETE' THEN
        RAISE EXCEPTION 'Final repayment allocation batch is immutable';
      END IF;
      IF OLD.status='APPLIED'
         AND NEW.status='REVERSED'
         AND (to_jsonb(NEW)-ARRAY['status','version']::text[])=(to_jsonb(OLD)-ARRAY['status','version']::text[])
         AND NEW.version=OLD.version+1
         AND EXISTS(
           SELECT 1 FROM public.loan_repayment_reversals r
           WHERE r.tenant_id=OLD.tenant_id AND r.allocation_batch_id=OLD.id AND r.status='POSTED'
         ) THEN
        RETURN NEW;
      END IF;
      IF OLD.status IN('APPLIED','REVERSED') THEN
        RAISE EXCEPTION 'Final repayment allocation batch is immutable';
      END IF;
      RETURN NEW;
    END $$;


--
-- Name: protect_final_repayment_evidence(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_final_repayment_evidence() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF TG_OP='DELETE' THEN
        RAISE EXCEPTION 'Final repayment evidence is immutable';
      END IF;
      IF OLD.status='SUCCESSFUL'
         AND NEW.status='REVERSED'
         AND (to_jsonb(NEW)-ARRAY['status','version','updated_at']::text[])=(to_jsonb(OLD)-ARRAY['status','version','updated_at']::text[])
         AND NEW.version=OLD.version+1
         AND EXISTS(
           SELECT 1 FROM public.loan_repayment_reversals r
           WHERE r.tenant_id=OLD.tenant_id AND r.repayment_id=OLD.id AND r.status='POSTED'
         ) THEN
        RETURN NEW;
      END IF;
      IF OLD.status IN('SUCCESSFUL','REVERSED','REFUNDED') THEN
        RAISE EXCEPTION 'Final repayment evidence is immutable';
      END IF;
      RETURN NEW;
    END $$;


--
-- Name: protect_final_repayment_reversal(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_final_repayment_reversal() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF TG_OP='DELETE' OR OLD.status IN('POSTED','FAILED') THEN RAISE EXCEPTION 'Final repayment reversal evidence is immutable'; END IF; RETURN NEW; END $$;


--
-- Name: protect_final_servicing_evidence(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_final_servicing_evidence() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN IF TG_OP='DELETE' OR OLD.status IN('POSTED','REVERSED','FAILED') THEN RAISE EXCEPTION 'Final servicing evidence is immutable'; END IF; RETURN NEW; END $$;


--
-- Name: protect_issued_offer(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_issued_offer() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN IF TG_OP='DELETE' OR OLD.status IN('ACCEPTED','DECLINED','EXPIRED','WITHDRAWN','SUPERSEDED') THEN RAISE EXCEPTION 'Terminal offer is immutable'; END IF;
      IF OLD.status='ISSUED' AND (NEW.tenant_id,NEW.application_id,NEW.decision_id,NEW.loan_product_version_id,NEW.currency,
        NEW.principal_amount,NEW.net_disbursement_amount,NEW.total_interest,NEW.total_fees,NEW.total_repayable,
        NEW.interest_rate,NEW.interest_type,NEW.repayment_frequency,NEW.tenure_days,NEW.terms,NEW.conditions,
        NEW.configuration_hash,NEW.calculation_input_hash,NEW.calculation_output_hash,NEW.document_hash) IS DISTINCT FROM
        (OLD.tenant_id,OLD.application_id,OLD.decision_id,OLD.loan_product_version_id,OLD.currency,
        OLD.principal_amount,OLD.net_disbursement_amount,OLD.total_interest,OLD.total_fees,OLD.total_repayable,
        OLD.interest_rate,OLD.interest_type,OLD.repayment_frequency,OLD.tenure_days,OLD.terms,OLD.conditions,
        OLD.configuration_hash,OLD.calculation_input_hash,OLD.calculation_output_hash,OLD.document_hash)
      THEN RAISE EXCEPTION 'Issued offer terms are immutable'; END IF; RETURN NEW; END $$;


--
-- Name: protect_ln08_history(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_ln08_history() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN RAISE EXCEPTION 'Financial lifecycle history is immutable'; END $$;


--
-- Name: protect_manual_underwriting_evidence(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_manual_underwriting_evidence() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN RAISE EXCEPTION 'Manual underwriting evidence is immutable'; END $$;


--
-- Name: protect_offer_calculation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_offer_calculation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN RAISE EXCEPTION 'Offer calculation evidence is immutable'; END $$;


--
-- Name: protect_posted_recovery(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_posted_recovery() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF TG_OP='DELETE' OR OLD.status IN('POSTED','REVERSED') THEN RAISE EXCEPTION 'Posted recovery is immutable'; END IF; RETURN NEW; END $$;


--
-- Name: protect_product_version_history(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_product_version_history() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN RAISE EXCEPTION 'Product version history is immutable'; END $$;


--
-- Name: protect_published_product_version(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_published_product_version() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF TG_OP='DELETE' AND OLD.status IN('PUBLISHED','RETIRED') THEN RAISE EXCEPTION 'Published product versions are immutable'; END IF; IF TG_OP='UPDATE' AND OLD.status='RETIRED' THEN RAISE EXCEPTION 'Retired product versions are immutable'; END IF; IF TG_OP='UPDATE' AND OLD.status='PUBLISHED' AND NOT(NEW.status='RETIRED' AND NEW.is_current=false AND (to_jsonb(NEW)-ARRAY['status','is_current','effective_to']::text[])=(to_jsonb(OLD)-ARRAY['status','is_current','effective_to']::text[])) THEN RAISE EXCEPTION 'Published product versions are immutable'; END IF; RETURN NEW; END $$;


--
-- Name: protect_repayment_allocation_evidence(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_repayment_allocation_evidence() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN RAISE EXCEPTION 'Repayment allocation evidence is immutable'; END $$;


--
-- Name: protect_repayment_request_evidence(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_repayment_request_evidence() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN IF TG_OP='DELETE' OR (to_jsonb(NEW)-'status'-'payment_request_id'-'updated_at')
        IS DISTINCT FROM (to_jsonb(OLD)-'status'-'payment_request_id'-'updated_at')
        THEN RAISE EXCEPTION 'Repayment request evidence is immutable'; END IF; RETURN NEW; END $$;


--
-- Name: protect_signed_contract(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_signed_contract() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN IF TG_OP='DELETE' OR OLD.status IN('SIGNED','ACTIVE','TERMINATED','COMPLETED','VOIDED') THEN RAISE EXCEPTION 'Signed contract is immutable'; END IF; RETURN NEW; END $$;


--
-- Name: protect_underwriting_evidence(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_underwriting_evidence() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN RAISE EXCEPTION 'Underwriting evidence is immutable'; END $$;


--
-- Name: record_application_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_application_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF TG_OP='INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN INSERT INTO public.loan_application_events(tenant_id,application_id,event_type,previous_status,new_status,event_data) VALUES(NEW.tenant_id,NEW.id,'STATUS_CHANGED',CASE WHEN TG_OP='INSERT' THEN NULL ELSE OLD.status END,NEW.status,'{}'); END IF; RETURN NEW; END $$;


--
-- Name: record_product_version_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_product_version_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF TG_OP='INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN INSERT INTO public.loan_product_version_history(tenant_id,loan_product_id,product_version_id,previous_status,new_status,approval_id,actor_id) VALUES(NEW.tenant_id,NEW.loan_product_id,NEW.id,CASE WHEN TG_OP='INSERT' THEN NULL ELSE OLD.status END,NEW.status,NEW.approval_id,NEW.published_by); END IF; RETURN NEW; END $$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: valid_allocation_order(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.valid_allocation_order(value jsonb) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $$ SELECT jsonb_typeof(value)='array' AND jsonb_array_length(value)=4 AND NOT EXISTS(SELECT required FROM unnest(ARRAY['PENALTY','FEES','INTEREST','PRINCIPAL']) required WHERE NOT value @> to_jsonb(ARRAY[required]::text[])) $$;


--
-- Name: valid_delinquency_buckets(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.valid_delinquency_buckets(value jsonb) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$ SELECT jsonb_typeof(value)='array' AND jsonb_array_length(value)>0 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(value) item WHERE jsonb_typeof(item)<>'object' OR NOT(jsonb_exists(item,'code') AND jsonb_exists(item,'minimum_dpd')) OR (item->>'minimum_dpd') !~ '^[0-9]+$') AND (SELECT count(*)=count(DISTINCT item->>'code') FROM jsonb_array_elements(value) item) AND (SELECT count(*)=count(DISTINCT (item->>'minimum_dpd')::integer) FROM jsonb_array_elements(value) item) $_$;


--
-- Name: validate_application_transition(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_application_transition() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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


--
-- Name: validate_installment_balances(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_installment_balances() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN
      IF NEW.principal_paid>NEW.principal_due OR NEW.interest_paid>NEW.interest_due OR NEW.fees_paid>NEW.fees_due OR NEW.penalty_paid>NEW.penalty_due OR NEW.total_paid>NEW.total_due THEN RAISE EXCEPTION 'Installment paid amount exceeds amount due'; END IF;
      IF NEW.total_paid=NEW.total_due THEN NEW.status='PAID'; NEW.paid_at=COALESCE(NEW.paid_at,now());
      ELSIF NEW.total_paid>0 THEN NEW.status='PARTIALLY_PAID'; NEW.paid_at=NULL; END IF; RETURN NEW; END $$;


--
-- Name: validate_manual_decision_separation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_manual_decision_separation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      DECLARE reviewer uuid; checker text;
      BEGIN IF NEW.decision_source='MANUAL' THEN
        SELECT reviewer_id INTO reviewer FROM public.loan_manual_review_recommendations
          WHERE tenant_id=NEW.tenant_id AND id=NEW.recommendation_id;
        IF reviewer IS NULL OR reviewer<>NEW.approval_maker_id THEN RAISE EXCEPTION 'Approval maker must own the recommendation'; END IF;
        IF reviewer=NEW.decided_by THEN RAISE EXCEPTION 'Reviewer cannot execute their recommendation'; END IF;
        FOR checker IN SELECT jsonb_array_elements_text(NEW.approval_checker_ids) LOOP
          IF checker::uuid=reviewer OR checker::uuid=NEW.decided_by THEN
            RAISE EXCEPTION 'Manual decision maker-checker separation violated'; END IF;
        END LOOP;
      END IF; RETURN NEW; END $$;


--
-- Name: validate_repayment_request_transition(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_repayment_request_transition() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN IF NEW.status IS DISTINCT FROM OLD.status AND NOT(
        (OLD.status='SUBMITTING' AND NEW.status IN('PENDING_COLLECTION','PENDING_MATCH','FAILED','MANUAL_REVIEW')) OR
        (OLD.status IN('PENDING_COLLECTION','PENDING_MATCH') AND NEW.status IN('CONFIRMED','FAILED','MANUAL_REVIEW'))
      ) THEN RAISE EXCEPTION 'Invalid repayment request transition'; END IF;
      IF NEW.status IN('PENDING_COLLECTION','PENDING_MATCH','CONFIRMED') AND NEW.payment_request_id IS NULL
      THEN RAISE EXCEPTION 'Payment request evidence is required'; END IF; RETURN NEW; END $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: lending_ledger_posting_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lending_ledger_posting_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    request_reference character varying(100) NOT NULL,
    event_type public.lending_ledger_event_type_enum NOT NULL,
    aggregate_type character varying(50) NOT NULL,
    aggregate_id uuid NOT NULL,
    loan_id uuid,
    amount bigint NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    status public.lending_ledger_posting_status_enum DEFAULT 'PENDING'::public.lending_ledger_posting_status_enum NOT NULL,
    idempotency_key character varying(150) NOT NULL,
    correlation_id uuid,
    causation_id uuid,
    request_id uuid,
    ledger_transaction_id uuid,
    ledger_transaction_reference character varying(100),
    failure_code character varying(100),
    failure_reason text,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    published_at timestamp with time zone,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp with time zone,
    attempt_count integer DEFAULT 0 NOT NULL,
    available_at timestamp with time zone DEFAULT now() NOT NULL,
    locked_at timestamp with time zone,
    locked_by character varying(150),
    posted_at timestamp with time zone,
    CONSTRAINT chk_lending_ledger_posting_amount CHECK (((amount)::numeric > (0)::numeric)),
    CONSTRAINT chk_lending_ledger_posting_currency CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT chk_lending_posting_attempts CHECK ((attempt_count >= 0))
);

ALTER TABLE ONLY public.lending_ledger_posting_requests FORCE ROW LEVEL SECURITY;


--
-- Name: loan_adjustments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_adjustments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    adjustment_type public.adjustment_type_enum NOT NULL,
    amount bigint NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    reason text NOT NULL,
    ledger_transaction_id uuid,
    approved_by uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    approval_id uuid,
    approval_payload_hash character(64),
    approval_consumed_at timestamp with time zone,
    approval_maker_id uuid,
    approval_checker_ids jsonb,
    executor_id uuid,
    idempotency_key character varying(255),
    request_hash character(64),
    correlation_id uuid,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_adjustment_amount CHECK (((amount)::numeric > (0)::numeric)),
    CONSTRAINT chk_adjustment_approval CHECK (((approval_id IS NOT NULL) AND (approval_payload_hash IS NOT NULL) AND (approval_consumed_at IS NOT NULL) AND (approval_maker_id IS NOT NULL) AND (jsonb_array_length(approval_checker_ids) > 0) AND (executor_id IS NOT NULL) AND (NOT (approval_checker_ids @> to_jsonb(ARRAY[(approval_maker_id)::text, (executor_id)::text]))))),
    CONSTRAINT chk_adjustment_ngn CHECK ((currency = 'NGN'::bpchar))
);

ALTER TABLE ONLY public.loan_adjustments FORCE ROW LEVEL SECURITY;


--
-- Name: loan_application_decisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_application_decisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    application_id uuid NOT NULL,
    decision public.loan_decision_enum NOT NULL,
    approved_amount bigint,
    approved_tenure_days integer,
    approved_interest_rate numeric(18,10),
    decision_reason text,
    decision_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    decided_by uuid,
    decided_at timestamp with time zone DEFAULT now() NOT NULL,
    decision_source character varying(20) DEFAULT 'AUTOMATED'::character varying NOT NULL,
    policy_version character varying(100),
    model_version character varying(100),
    reason_codes jsonb DEFAULT '[]'::jsonb NOT NULL,
    evaluation_id uuid,
    request_hash character(64),
    approval_id uuid,
    review_case_id uuid,
    recommendation_id uuid,
    approval_action character varying(100),
    approval_resource_type character varying(100),
    approval_resource_id uuid,
    approval_payload_hash character(64),
    approval_consumed_at timestamp with time zone,
    approval_checker_ids jsonb,
    required_authority_level integer,
    approved_authority_level integer,
    idempotency_key character varying(255),
    correlation_id uuid,
    approval_maker_id uuid,
    CONSTRAINT chk_manual_decision_approval CHECK ((((decision_source)::text <> 'MANUAL'::text) OR ((review_case_id IS NOT NULL) AND (recommendation_id IS NOT NULL) AND (approval_id IS NOT NULL) AND ((approval_action)::text = 'MANUAL_LOAN_APPROVAL'::text) AND ((approval_resource_type)::text = 'loan_manual_review_case'::text) AND (approval_resource_id = review_case_id) AND (approval_payload_hash IS NOT NULL) AND (approval_consumed_at IS NOT NULL) AND (approval_maker_id IS NOT NULL) AND (jsonb_array_length(approval_checker_ids) > 0) AND (required_authority_level > 0) AND (approved_authority_level >= required_authority_level) AND (idempotency_key IS NOT NULL) AND (correlation_id IS NOT NULL)))),
    CONSTRAINT loan_application_decisions_decision_source_check CHECK (((decision_source)::text = ANY (ARRAY[('AUTOMATED'::character varying)::text, ('MANUAL'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_application_decisions FORCE ROW LEVEL SECURITY;


--
-- Name: loan_application_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_application_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    application_id uuid NOT NULL,
    document_type character varying(100) NOT NULL,
    document_reference character varying(255) NOT NULL,
    verification_status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);

ALTER TABLE ONLY public.loan_application_documents FORCE ROW LEVEL SECURITY;


--
-- Name: loan_application_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_application_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    application_id uuid NOT NULL,
    event_type character varying(100) NOT NULL,
    previous_status public.loan_application_status_enum,
    new_status public.loan_application_status_enum,
    actor_id uuid,
    event_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.loan_application_events FORCE ROW LEVEL SECURITY;


--
-- Name: loan_application_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_application_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    application_id uuid NOT NULL,
    review_type public.application_review_type_enum NOT NULL,
    reviewer_id uuid,
    score numeric(10,4),
    decision public.loan_decision_enum,
    findings jsonb DEFAULT '{}'::jsonb NOT NULL,
    comments text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.loan_application_reviews FORCE ROW LEVEL SECURITY;


--
-- Name: loan_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    loan_product_id uuid NOT NULL,
    application_number character varying(100) NOT NULL,
    requested_amount bigint NOT NULL,
    approved_amount bigint,
    requested_tenure_days integer NOT NULL,
    approved_tenure_days integer,
    requested_interest_rate numeric(18,10),
    approved_interest_rate numeric(18,10),
    status public.loan_application_status_enum DEFAULT 'DRAFT'::public.loan_application_status_enum NOT NULL,
    purpose character varying(500),
    application_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    submitted_at timestamp with time zone,
    approved_at timestamp with time zone,
    rejected_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp with time zone,
    loan_product_version_id uuid,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    idempotency_key character varying(255),
    request_hash character(64),
    correlation_id uuid,
    product_configuration_hash character(64),
    kyc_tier character varying(50),
    kyc_status character varying(30),
    kyc_verification_reference character varying(255),
    affordability_input_hash character(64),
    consent_reference character varying(255),
    evidence_observed_at timestamp with time zone,
    evidence_expires_at timestamp with time zone,
    CONSTRAINT chk_application_amount CHECK (((requested_amount)::numeric > (0)::numeric)),
    CONSTRAINT chk_application_ngn CHECK ((currency = 'NGN'::bpchar)),
    CONSTRAINT chk_application_submission_evidence CHECK (((status = 'DRAFT'::public.loan_application_status_enum) OR ((submitted_at IS NOT NULL) AND (loan_product_version_id IS NOT NULL) AND (product_configuration_hash IS NOT NULL) AND (idempotency_key IS NOT NULL) AND (request_hash IS NOT NULL) AND (consent_reference IS NOT NULL)))),
    CONSTRAINT chk_application_tenure CHECK ((requested_tenure_days > 0)),
    CONSTRAINT loan_applications_currency_check CHECK ((currency ~ '^[A-Z]{3}$'::text))
);

ALTER TABLE ONLY public.loan_applications FORCE ROW LEVEL SECURITY;


--
-- Name: loan_asset_disbursements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_asset_disbursements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    vendor_name character varying(200) NOT NULL,
    vendor_account_reference character varying(200),
    amount numeric(20,2) NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    payment_transaction_id uuid,
    ledger_transaction_id uuid,
    status public.disbursement_status_enum DEFAULT 'PENDING'::public.disbursement_status_enum NOT NULL,
    provider_reference character varying(200),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_asset_disbursement_amount CHECK ((amount > (0)::numeric))
);

ALTER TABLE ONLY public.loan_asset_disbursements FORCE ROW LEVEL SECURITY;


--
-- Name: loan_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    asset_type character varying(100) NOT NULL,
    asset_name character varying(200) NOT NULL,
    description text,
    vendor_name character varying(200),
    vendor_reference character varying(200),
    purchase_price numeric(20,2) NOT NULL,
    customer_contribution numeric(20,2) DEFAULT 0 NOT NULL,
    financed_amount numeric(20,2) NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    status public.asset_status_enum DEFAULT 'PROPOSED'::public.asset_status_enum NOT NULL,
    asset_metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_asset_contribution CHECK ((customer_contribution >= (0)::numeric)),
    CONSTRAINT chk_asset_financed_amount CHECK ((financed_amount > (0)::numeric)),
    CONSTRAINT chk_asset_funding_components CHECK ((purchase_price = (customer_contribution + financed_amount))),
    CONSTRAINT chk_asset_purchase_price CHECK ((purchase_price > (0)::numeric))
);

ALTER TABLE ONLY public.loan_assets FORCE ROW LEVEL SECURITY;


--
-- Name: loan_automated_evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_automated_evaluations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    application_id uuid NOT NULL,
    policy_version character varying(100) NOT NULL,
    model_version character varying(100),
    product_configuration_hash character(64) NOT NULL,
    input_hash character(64) NOT NULL,
    rule_snapshot_hash character(64) NOT NULL,
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    outcome public.loan_decision_enum,
    score numeric(18,10),
    reason_codes jsonb DEFAULT '[]'::jsonb NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    worker_id character varying(100),
    lease_expires_at timestamp with time zone,
    last_error_code character varying(100),
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    CONSTRAINT loan_automated_evaluations_retry_count_check CHECK ((retry_count >= 0)),
    CONSTRAINT loan_automated_evaluations_status_check CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('PROCESSING'::character varying)::text, ('COMPLETED'::character varying)::text, ('FAILED'::character varying)::text, ('DEAD_LETTERED'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_automated_evaluations FORCE ROW LEVEL SECURITY;


--
-- Name: loan_automated_rule_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_automated_rule_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    evaluation_id uuid NOT NULL,
    application_id uuid NOT NULL,
    rule_code character varying(100) NOT NULL,
    rule_version character varying(100) NOT NULL,
    outcome character varying(10) NOT NULL,
    reason_code character varying(100) NOT NULL,
    observed_value_hash character(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loan_automated_rule_results_outcome_check CHECK (((outcome)::text = ANY (ARRAY[('PASS'::character varying)::text, ('FAIL'::character varying)::text, ('REFER'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_automated_rule_results FORCE ROW LEVEL SECURITY;


--
-- Name: loan_collaterals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_collaterals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    collateral_type public.collateral_type_enum NOT NULL,
    description text,
    asset_identifier character varying(200),
    ownership_reference character varying(200),
    valuation_amount numeric(20,2),
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    forced_sale_value numeric(20,2),
    status public.collateral_status_enum DEFAULT 'PENDING'::public.collateral_status_enum NOT NULL,
    verification_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    verified_at timestamp with time zone,
    released_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_collateral_forced_sale_value CHECK (((forced_sale_value IS NULL) OR ((forced_sale_value >= (0)::numeric) AND ((valuation_amount IS NULL) OR (forced_sale_value <= valuation_amount))))),
    CONSTRAINT chk_collateral_value CHECK (((valuation_amount IS NULL) OR (valuation_amount >= (0)::numeric)))
);

ALTER TABLE ONLY public.loan_collaterals FORCE ROW LEVEL SECURITY;


--
-- Name: loan_collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_collections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    collection_channel public.collection_channel_enum NOT NULL,
    collection_stage character varying(50),
    contact_reference character varying(200),
    notes text,
    promised_amount numeric(20,2),
    promised_date date,
    outcome character varying(100),
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.loan_collections FORCE ROW LEVEL SECURITY;


--
-- Name: loan_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    contract_reference character varying(100) NOT NULL,
    contract_version integer DEFAULT 1 NOT NULL,
    status public.loan_contract_status_enum DEFAULT 'PENDING_SIGNATURE'::public.loan_contract_status_enum NOT NULL,
    document_reference character varying(500) NOT NULL,
    document_hash character(64) NOT NULL,
    terms_snapshot jsonb NOT NULL,
    borrower_consent_reference character varying(255),
    borrower_signed_at timestamp with time zone,
    lender_signed_at timestamp with time zone,
    effective_at timestamp with time zone,
    terminated_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    acceptance_id uuid,
    authorization_reference character varying(255),
    authorization_hash character(64),
    consent_reference character varying(255),
    accepted_document_hash character(64),
    idempotency_key character varying(255),
    request_hash character(64),
    correlation_id uuid,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL
);

ALTER TABLE ONLY public.loan_contracts FORCE ROW LEVEL SECURITY;


--
-- Name: loan_delinquency_assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_delinquency_assessments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    assessment_date date NOT NULL,
    days_past_due integer NOT NULL,
    previous_bucket character varying(50),
    bucket character varying(50) NOT NULL,
    oldest_unpaid_due_date date,
    grace_period_days integer NOT NULL,
    timezone character varying(64) NOT NULL,
    outstanding_amount bigint NOT NULL,
    policy_hash character(64) NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    correlation_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT loan_delinquency_assessments_days_past_due_check CHECK ((days_past_due >= 0)),
    CONSTRAINT loan_delinquency_assessments_grace_period_days_check CHECK ((grace_period_days >= 0)),
    CONSTRAINT loan_delinquency_assessments_outstanding_amount_check CHECK ((outstanding_amount >= 0))
);

ALTER TABLE ONLY public.loan_delinquency_assessments FORCE ROW LEVEL SECURITY;


--
-- Name: loan_direct_debit_mandates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_direct_debit_mandates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    mandate_reference character varying(150) NOT NULL,
    account_id uuid NOT NULL,
    provider_code character varying(100),
    provider_mandate_reference character varying(200),
    maximum_amount numeric(20,2),
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    status public.mandate_status_enum DEFAULT 'PENDING'::public.mandate_status_enum NOT NULL,
    start_date date,
    expiry_date date,
    activated_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid
);

ALTER TABLE ONLY public.loan_direct_debit_mandates FORCE ROW LEVEL SECURITY;


--
-- Name: loan_disbursement_saga_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_disbursement_saga_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    disbursement_id uuid NOT NULL,
    step_type character varying(50) NOT NULL,
    attempt_number integer NOT NULL,
    status character varying(20) NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    request_hash character(64) NOT NULL,
    response_reference character varying(255),
    evidence_hash character(64),
    error_code character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT loan_disbursement_saga_steps_attempt_number_check CHECK ((attempt_number > 0)),
    CONSTRAINT loan_disbursement_saga_steps_status_check CHECK (((status)::text = ANY (ARRAY[('STARTED'::character varying)::text, ('PENDING'::character varying)::text, ('SUCCEEDED'::character varying)::text, ('FAILED'::character varying)::text, ('AMBIGUOUS'::character varying)::text]))),
    CONSTRAINT loan_disbursement_saga_steps_step_type_check CHECK (((step_type)::text = ANY (ARRAY[('APPROVAL'::character varying)::text, ('LEDGER_POST'::character varying)::text, ('PAYMENT_SUBMIT'::character varying)::text, ('PAYMENT_INQUIRY'::character varying)::text, ('LEDGER_REVERSAL'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_disbursement_saga_steps FORCE ROW LEVEL SECURITY;


--
-- Name: loan_disbursements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_disbursements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    disbursement_reference character varying(100) NOT NULL,
    destination_account_id uuid,
    amount bigint NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    status character varying(30) DEFAULT 'PENDING'::public.disbursement_status_enum NOT NULL,
    payment_transaction_id uuid,
    ledger_transaction_id uuid,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    failure_reason text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    destination_reference character varying(255),
    approval_id uuid,
    approval_payload_hash character(64),
    approval_consumed_at timestamp with time zone,
    approval_maker_id uuid,
    approval_checker_ids jsonb,
    idempotency_key character varying(255),
    request_hash character(64),
    correlation_id uuid,
    ledger_reversal_transaction_id uuid,
    active_step character varying(50),
    attempt_count integer DEFAULT 0 NOT NULL,
    lease_expires_at timestamp with time zone,
    next_inquiry_at timestamp with time zone,
    failure_code character varying(100),
    outcome_evidence_hash character(64),
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_disbursement_amount CHECK (((amount)::numeric > (0)::numeric)),
    CONSTRAINT chk_disbursement_approval CHECK ((((status)::text = ANY (ARRAY[('CREATED'::character varying)::text, ('APPROVAL_PENDING'::character varying)::text])) OR ((approval_id IS NOT NULL) AND (approval_payload_hash IS NOT NULL) AND (approval_consumed_at IS NOT NULL)))),
    CONSTRAINT chk_disbursement_ledger_before_payment CHECK ((((status)::text <> ALL (ARRAY[('PAYMENT_SUBMITTING'::character varying)::text, ('PENDING'::character varying)::text, ('SUCCEEDED'::character varying)::text])) OR (ledger_transaction_id IS NOT NULL))),
    CONSTRAINT chk_disbursement_ngn CHECK ((currency = 'NGN'::bpchar)),
    CONSTRAINT chk_disbursement_state CHECK (((status)::text = ANY (ARRAY[('CREATED'::character varying)::text, ('APPROVAL_PENDING'::character varying)::text, ('LEDGER_POSTING'::character varying)::text, ('PAYMENT_SUBMITTING'::character varying)::text, ('PENDING'::character varying)::text, ('SUCCEEDED'::character varying)::text, ('COMPENSATING'::character varying)::text, ('COMPENSATED'::character varying)::text, ('FAILED'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_disbursements FORCE ROW LEVEL SECURITY;


--
-- Name: loan_idempotency_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_idempotency_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid,
    idempotency_key character varying(255) NOT NULL,
    request_hash character varying(128) NOT NULL,
    operation_type character varying(100) NOT NULL,
    resource_id uuid,
    response_status integer,
    response_body jsonb,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.loan_idempotency_keys FORCE ROW LEVEL SECURITY;


--
-- Name: loan_inbox_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_inbox_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    event_id uuid NOT NULL,
    source_service character varying(100) NOT NULL,
    event_type character varying(150) NOT NULL,
    aggregate_type character varying(100),
    aggregate_id uuid,
    correlation_id uuid,
    causation_id uuid,
    payload jsonb NOT NULL,
    payload_hash character varying(128) NOT NULL,
    status public.inbox_event_status_enum DEFAULT 'RECEIVED'::public.inbox_event_status_enum NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    available_at timestamp with time zone DEFAULT now() NOT NULL,
    locked_at timestamp with time zone,
    locked_by character varying(150),
    processed_at timestamp with time zone,
    last_error text,
    received_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_inbox_attempts CHECK ((attempt_count >= 0))
);

ALTER TABLE ONLY public.loan_inbox_events FORCE ROW LEVEL SECURITY;


--
-- Name: loan_installments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_installments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    schedule_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    installment_number integer NOT NULL,
    due_date date NOT NULL,
    principal_due bigint DEFAULT 0 NOT NULL,
    interest_due bigint DEFAULT 0 NOT NULL,
    fees_due bigint DEFAULT 0 NOT NULL,
    penalty_due bigint DEFAULT 0 NOT NULL,
    total_due bigint NOT NULL,
    principal_paid bigint DEFAULT 0 NOT NULL,
    interest_paid bigint DEFAULT 0 NOT NULL,
    fees_paid bigint DEFAULT 0 NOT NULL,
    penalty_paid bigint DEFAULT 0 NOT NULL,
    total_paid bigint DEFAULT 0 NOT NULL,
    status public.installment_status_enum DEFAULT 'PENDING'::public.installment_status_enum NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    period_start date,
    period_end date,
    opening_principal bigint,
    unrounded_interest numeric(30,12),
    calculation_hash character(64),
    CONSTRAINT chk_installment_amounts CHECK ((((principal_due)::numeric >= (0)::numeric) AND ((interest_due)::numeric >= (0)::numeric) AND ((fees_due)::numeric >= (0)::numeric) AND ((penalty_due)::numeric >= (0)::numeric) AND ((principal_paid)::numeric >= (0)::numeric) AND ((interest_paid)::numeric >= (0)::numeric) AND ((fees_paid)::numeric >= (0)::numeric) AND ((penalty_paid)::numeric >= (0)::numeric))),
    CONSTRAINT chk_installment_due_total CHECK ((total_due = (((principal_due + interest_due) + fees_due) + penalty_due))),
    CONSTRAINT chk_installment_paid_total CHECK ((total_paid = (((principal_paid + interest_paid) + fees_paid) + penalty_paid)))
);

ALTER TABLE ONLY public.loan_installments FORCE ROW LEVEL SECURITY;


--
-- Name: loan_interest_accruals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_interest_accruals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    accrual_reference character varying(100) NOT NULL,
    accrual_date date NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    opening_principal bigint NOT NULL,
    annualized_rate numeric(18,10) NOT NULL,
    day_count_numerator integer NOT NULL,
    day_count_denominator integer NOT NULL,
    interest_amount bigint NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::public.accrual_status_enum NOT NULL,
    calculation_version character varying(50) NOT NULL,
    calculation_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    ledger_posting_request_id uuid,
    ledger_transaction_id uuid,
    reversal_of_id uuid,
    posted_at timestamp with time zone,
    reversed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    product_version_id uuid,
    installment_id uuid,
    unrounded_interest numeric(30,12),
    rounding_mode character varying(30),
    day_count_convention character varying(20),
    calculation_policy_version character varying(50),
    configuration_hash character(64),
    calculation_input_hash character(64),
    calculation_output_hash character(64),
    idempotency_key character varying(255),
    correlation_id uuid,
    causation_id uuid,
    ledger_idempotency_key character varying(255),
    reversal_ledger_transaction_id uuid,
    attempt_count integer DEFAULT 0 NOT NULL,
    available_at timestamp with time zone DEFAULT now() NOT NULL,
    lease_expires_at timestamp with time zone,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_accrual_currency CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT chk_accrual_period CHECK ((period_end >= period_start)),
    CONSTRAINT chk_accrual_values CHECK ((((opening_principal)::numeric >= (0)::numeric) AND (annualized_rate >= (0)::numeric) AND (day_count_numerator > 0) AND (day_count_denominator > 0) AND ((interest_amount)::numeric >= (0)::numeric))),
    CONSTRAINT chk_interest_accrual_evidence CHECK ((((status)::text = 'PENDING'::text) OR ((product_version_id IS NOT NULL) AND (unrounded_interest IS NOT NULL) AND (rounding_mode IS NOT NULL) AND (day_count_convention IS NOT NULL) AND (calculation_policy_version IS NOT NULL) AND (configuration_hash IS NOT NULL) AND (calculation_input_hash IS NOT NULL) AND (calculation_output_hash IS NOT NULL) AND (idempotency_key IS NOT NULL)))),
    CONSTRAINT chk_interest_accrual_ledger CHECK ((((status)::text <> ALL (ARRAY[('POSTED'::character varying)::text, ('REVERSED'::character varying)::text])) OR (ledger_transaction_id IS NOT NULL))),
    CONSTRAINT chk_interest_accrual_ngn CHECK ((currency = 'NGN'::bpchar)),
    CONSTRAINT chk_interest_accrual_state CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('POSTING'::character varying)::text, ('POSTED'::character varying)::text, ('REVERSED'::character varying)::text, ('FAILED'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_interest_accruals FORCE ROW LEVEL SECURITY;


--
-- Name: loan_manual_decision_conditions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_manual_decision_conditions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    recommendation_id uuid NOT NULL,
    condition_code character varying(100) NOT NULL,
    description text NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    evidence_reference character varying(255),
    satisfied_by uuid,
    satisfied_at timestamp with time zone,
    waiver_approval_id uuid,
    waiver_payload_hash character(64),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT loan_manual_decision_conditions_check CHECK ((((status)::text <> 'SATISFIED'::text) OR ((evidence_reference IS NOT NULL) AND (satisfied_by IS NOT NULL) AND (satisfied_at IS NOT NULL)))),
    CONSTRAINT loan_manual_decision_conditions_check1 CHECK ((((status)::text <> 'WAIVED'::text) OR ((waiver_approval_id IS NOT NULL) AND (waiver_payload_hash IS NOT NULL)))),
    CONSTRAINT loan_manual_decision_conditions_status_check CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('SATISFIED'::character varying)::text, ('WAIVED'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_manual_decision_conditions FORCE ROW LEVEL SECURITY;


--
-- Name: loan_manual_review_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_manual_review_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    review_case_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    expected_lock_version integer NOT NULL,
    resulting_lock_version integer NOT NULL,
    lease_expires_at timestamp with time zone NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    request_hash character(64) NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT loan_manual_review_assignments_check CHECK ((resulting_lock_version = (expected_lock_version + 1))),
    CONSTRAINT loan_manual_review_assignments_expected_lock_version_check CHECK ((expected_lock_version >= 0))
);

ALTER TABLE ONLY public.loan_manual_review_assignments FORCE ROW LEVEL SECURITY;


--
-- Name: loan_manual_review_cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_manual_review_cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    application_id uuid NOT NULL,
    status character varying(30) DEFAULT 'OPEN'::character varying NOT NULL,
    assigned_reviewer_id uuid,
    assigned_at timestamp with time zone,
    lease_expires_at timestamp with time zone,
    lock_version integer DEFAULT 0 NOT NULL,
    required_authority_level integer NOT NULL,
    opened_reason_codes jsonb DEFAULT '[]'::jsonb NOT NULL,
    opened_at timestamp with time zone DEFAULT now() NOT NULL,
    decided_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    opening_idempotency_key character varying(255),
    opening_request_hash character(64),
    CONSTRAINT chk_manual_case_opening_idempotency CHECK (((opening_idempotency_key IS NULL) = (opening_request_hash IS NULL))),
    CONSTRAINT loan_manual_review_cases_lock_version_check CHECK ((lock_version >= 0)),
    CONSTRAINT loan_manual_review_cases_required_authority_level_check CHECK ((required_authority_level > 0)),
    CONSTRAINT loan_manual_review_cases_status_check CHECK (((status)::text = ANY (ARRAY[('OPEN'::character varying)::text, ('ASSIGNED'::character varying)::text, ('PENDING_APPROVAL'::character varying)::text, ('DECIDED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_manual_review_cases FORCE ROW LEVEL SECURITY;


--
-- Name: loan_manual_review_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_manual_review_recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    review_case_id uuid NOT NULL,
    application_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    recommendation public.loan_decision_enum NOT NULL,
    proposed_amount bigint,
    proposed_tenure_days integer,
    proposed_interest_rate numeric(18,10),
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    reason_codes jsonb NOT NULL,
    evidence_references jsonb DEFAULT '[]'::jsonb NOT NULL,
    comments text,
    policy_version character varying(100) NOT NULL,
    request_hash character(64) NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT loan_manual_review_recommendations_check CHECK (((recommendation <> ALL (ARRAY['APPROVED'::public.loan_decision_enum, 'CONDITIONAL_APPROVAL'::public.loan_decision_enum])) OR ((proposed_amount > 0) AND (proposed_tenure_days > 0) AND (proposed_interest_rate >= (0)::numeric)))),
    CONSTRAINT loan_manual_review_recommendations_currency_check CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT loan_manual_review_recommendations_currency_check1 CHECK ((currency = 'NGN'::bpchar)),
    CONSTRAINT loan_manual_review_recommendations_evidence_references_check CHECK ((jsonb_typeof(evidence_references) = 'array'::text)),
    CONSTRAINT loan_manual_review_recommendations_reason_codes_check CHECK (((jsonb_typeof(reason_codes) = 'array'::text) AND (jsonb_array_length(reason_codes) > 0)))
);

ALTER TABLE ONLY public.loan_manual_review_recommendations FORCE ROW LEVEL SECURITY;


--
-- Name: loan_offer_acceptances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_offer_acceptances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    authorization_reference character varying(255) NOT NULL,
    authorization_hash character(64) NOT NULL,
    consent_reference character varying(255) NOT NULL,
    accepted_document_hash character(64) NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    request_hash character(64) NOT NULL,
    correlation_id uuid NOT NULL,
    accepted_at timestamp with time zone DEFAULT now() NOT NULL,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL
);

ALTER TABLE ONLY public.loan_offer_acceptances FORCE ROW LEVEL SECURITY;


--
-- Name: loan_offer_fee_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_offer_fee_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    fee_code character varying(100) NOT NULL,
    description character varying(255) NOT NULL,
    amount bigint NOT NULL,
    treatment character varying(30) NOT NULL,
    calculation_basis jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loan_offer_fee_lines_amount_check CHECK ((amount >= 0)),
    CONSTRAINT loan_offer_fee_lines_treatment_check CHECK (((treatment)::text = ANY (ARRAY[('FINANCED'::character varying)::text, ('DEDUCTED_FROM_DISBURSEMENT'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_offer_fee_lines FORCE ROW LEVEL SECURITY;


--
-- Name: loan_offer_installments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_offer_installments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    schedule_id uuid NOT NULL,
    installment_number integer NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    due_date date NOT NULL,
    opening_principal bigint NOT NULL,
    principal_due bigint NOT NULL,
    interest_due bigint NOT NULL,
    fees_due bigint DEFAULT 0 NOT NULL,
    total_due bigint NOT NULL,
    unrounded_interest numeric(30,12) NOT NULL,
    calculation_hash character(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loan_offer_installments_check CHECK ((period_end >= period_start)),
    CONSTRAINT loan_offer_installments_check1 CHECK ((total_due = ((principal_due + interest_due) + fees_due))),
    CONSTRAINT loan_offer_installments_fees_due_check CHECK ((fees_due >= 0)),
    CONSTRAINT loan_offer_installments_installment_number_check CHECK ((installment_number > 0)),
    CONSTRAINT loan_offer_installments_interest_due_check CHECK ((interest_due >= 0)),
    CONSTRAINT loan_offer_installments_opening_principal_check CHECK ((opening_principal >= 0)),
    CONSTRAINT loan_offer_installments_principal_due_check CHECK ((principal_due >= 0))
);

ALTER TABLE ONLY public.loan_offer_installments FORCE ROW LEVEL SECURITY;


--
-- Name: loan_offer_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_offer_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    schedule_version integer DEFAULT 1 NOT NULL,
    effective_date date NOT NULL,
    maturity_date date NOT NULL,
    total_principal bigint NOT NULL,
    total_interest bigint NOT NULL,
    total_fees bigint DEFAULT 0 NOT NULL,
    total_amount bigint NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    calculation_version character varying(50) NOT NULL,
    calculation_input_hash character(64) NOT NULL,
    calculation_output_hash character(64) NOT NULL,
    rounding_mode character varying(30) NOT NULL,
    day_count_convention character varying(20) NOT NULL,
    unrounded_total_interest numeric(30,12) NOT NULL,
    rounding_residual bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT loan_offer_schedules_check CHECK ((total_amount = ((total_principal + total_interest) + total_fees))),
    CONSTRAINT loan_offer_schedules_check1 CHECK ((maturity_date >= effective_date)),
    CONSTRAINT loan_offer_schedules_currency_check CHECK ((currency = 'NGN'::bpchar)),
    CONSTRAINT loan_offer_schedules_schedule_version_check CHECK ((schedule_version > 0)),
    CONSTRAINT loan_offer_schedules_total_fees_check CHECK ((total_fees >= 0)),
    CONSTRAINT loan_offer_schedules_total_interest_check CHECK ((total_interest >= 0)),
    CONSTRAINT loan_offer_schedules_total_principal_check CHECK ((total_principal > 0))
);

ALTER TABLE ONLY public.loan_offer_schedules FORCE ROW LEVEL SECURITY;


--
-- Name: loan_offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    application_id uuid NOT NULL,
    decision_id uuid,
    loan_product_version_id uuid NOT NULL,
    offer_reference character varying(100) NOT NULL,
    version_number integer DEFAULT 1 NOT NULL,
    status public.loan_offer_status_enum DEFAULT 'DRAFT'::public.loan_offer_status_enum NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    principal_amount bigint NOT NULL,
    net_disbursement_amount bigint NOT NULL,
    total_interest bigint DEFAULT 0 NOT NULL,
    total_fees bigint DEFAULT 0 NOT NULL,
    total_repayable bigint NOT NULL,
    interest_rate numeric(18,10) NOT NULL,
    interest_rate_period public.interest_rate_period_enum NOT NULL,
    interest_type public.interest_type_enum NOT NULL,
    interest_payment_method public.interest_payment_method_enum NOT NULL,
    repayment_frequency public.repayment_frequency_enum NOT NULL,
    tenure_days integer NOT NULL,
    first_payment_date date,
    maturity_date date NOT NULL,
    terms jsonb DEFAULT '{}'::jsonb NOT NULL,
    conditions jsonb DEFAULT '[]'::jsonb NOT NULL,
    issued_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    accepted_at timestamp with time zone,
    declined_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    configuration_hash character(64),
    calculation_version character varying(50),
    calculation_input_hash character(64),
    calculation_output_hash character(64),
    rounding_mode character varying(30),
    day_count_convention character varying(20),
    unrounded_interest numeric(30,12),
    rounding_residual bigint DEFAULT 0 NOT NULL,
    idempotency_key character varying(255),
    request_hash character(64),
    correlation_id uuid,
    document_reference character varying(500),
    document_hash character(64),
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_offer_amounts CHECK ((((principal_amount)::numeric > (0)::numeric) AND ((net_disbursement_amount)::numeric >= (0)::numeric) AND ((total_interest)::numeric >= (0)::numeric) AND ((total_fees)::numeric >= (0)::numeric) AND (total_repayable = ((principal_amount + total_interest) + total_fees)))),
    CONSTRAINT chk_offer_calculation CHECK (((status = 'DRAFT'::public.loan_offer_status_enum) OR ((configuration_hash IS NOT NULL) AND (calculation_version IS NOT NULL) AND (calculation_input_hash IS NOT NULL) AND (calculation_output_hash IS NOT NULL) AND (rounding_mode IS NOT NULL) AND (day_count_convention IS NOT NULL) AND (unrounded_interest IS NOT NULL) AND (document_reference IS NOT NULL) AND (document_hash IS NOT NULL)))),
    CONSTRAINT chk_offer_currency CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT chk_offer_expiry CHECK (((issued_at IS NULL) OR (expires_at > issued_at))),
    CONSTRAINT chk_offer_ngn CHECK ((currency = 'NGN'::bpchar)),
    CONSTRAINT chk_offer_rate_tenure CHECK (((interest_rate >= (0)::numeric) AND (tenure_days > 0)))
);

ALTER TABLE ONLY public.loan_offers FORCE ROW LEVEL SECURITY;


--
-- Name: loan_outbox_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_outbox_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    aggregate_type character varying(100) NOT NULL,
    aggregate_id uuid NOT NULL,
    event_type character varying(150) NOT NULL,
    payload jsonb NOT NULL,
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    available_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    event_version integer DEFAULT 1 NOT NULL,
    idempotency_key character varying(255),
    correlation_id uuid,
    aggregate_version integer DEFAULT 1 NOT NULL,
    causation_id uuid,
    data_classification character varying(20) DEFAULT 'CONFIDENTIAL'::character varying NOT NULL,
    lease_owner character varying(150),
    lease_expires_at timestamp with time zone,
    CONSTRAINT chk_loan_outbox_lease CHECK (((((status)::text = 'PROCESSING'::text) AND (lease_owner IS NOT NULL) AND (lease_expires_at IS NOT NULL)) OR (((status)::text <> 'PROCESSING'::text) AND (lease_owner IS NULL) AND (lease_expires_at IS NULL)))),
    CONSTRAINT chk_loan_outbox_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PROCESSING'::character varying, 'PUBLISHED'::character varying, 'FAILED'::character varying])::text[]))),
    CONSTRAINT loan_outbox_events_aggregate_version_check CHECK ((aggregate_version > 0)),
    CONSTRAINT loan_outbox_events_data_classification_check CHECK (((data_classification)::text = ANY ((ARRAY['PUBLIC'::character varying, 'INTERNAL'::character varying, 'CONFIDENTIAL'::character varying, 'RESTRICTED'::character varying])::text[]))),
    CONSTRAINT loan_outbox_events_event_version_check CHECK ((event_version > 0))
);

ALTER TABLE ONLY public.loan_outbox_events FORCE ROW LEVEL SECURITY;


--
-- Name: loan_parties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_parties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    customer_id uuid,
    party_role public.party_role_enum NOT NULL,
    name character varying(200),
    phone_number character varying(30),
    email character varying(255),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.loan_parties FORCE ROW LEVEL SECURITY;


--
-- Name: loan_payment_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_payment_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    repayment_id uuid,
    link_reference character varying(150) NOT NULL,
    amount numeric(20,2),
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    expires_at timestamp with time zone,
    used_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.loan_payment_links FORCE ROW LEVEL SECURITY;


--
-- Name: loan_penalty_assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_penalty_assessments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    installment_id uuid NOT NULL,
    product_version_id uuid NOT NULL,
    assessment_date date NOT NULL,
    assessment_period_start date NOT NULL,
    assessment_period_end date NOT NULL,
    penalty_type character varying(20) NOT NULL,
    penalty_frequency character varying(20) NOT NULL,
    basis_amount bigint NOT NULL,
    penalty_rate numeric(18,10),
    fixed_amount bigint,
    unrounded_amount numeric(30,12) NOT NULL,
    amount bigint NOT NULL,
    cumulative_before bigint NOT NULL,
    cap_amount bigint,
    grace_period_days integer NOT NULL,
    compounds boolean DEFAULT false NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    policy_hash character(64) NOT NULL,
    calculation_input_hash character(64) NOT NULL,
    calculation_output_hash character(64) NOT NULL,
    rounding_mode character varying(30) NOT NULL,
    calculation_policy_version character varying(50) NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    correlation_id uuid NOT NULL,
    ledger_idempotency_key character varying(255) NOT NULL,
    ledger_transaction_id uuid,
    reversal_ledger_transaction_id uuid,
    posted_at timestamp with time zone,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loan_penalty_assessments_amount_check CHECK ((amount >= 0)),
    CONSTRAINT loan_penalty_assessments_basis_amount_check CHECK ((basis_amount >= 0)),
    CONSTRAINT loan_penalty_assessments_check CHECK ((assessment_period_end >= assessment_period_start)),
    CONSTRAINT loan_penalty_assessments_check1 CHECK (((((penalty_type)::text = 'FIXED'::text) AND (fixed_amount IS NOT NULL) AND (penalty_rate IS NULL)) OR (((penalty_type)::text = 'PERCENTAGE'::text) AND (penalty_rate IS NOT NULL) AND (fixed_amount IS NULL)))),
    CONSTRAINT loan_penalty_assessments_check2 CHECK (((cap_amount IS NULL) OR ((cumulative_before + amount) <= cap_amount))),
    CONSTRAINT loan_penalty_assessments_check3 CHECK ((((status)::text <> ALL (ARRAY[('POSTED'::character varying)::text, ('REVERSED'::character varying)::text])) OR (ledger_transaction_id IS NOT NULL))),
    CONSTRAINT loan_penalty_assessments_compounds_check CHECK ((compounds = false)),
    CONSTRAINT loan_penalty_assessments_cumulative_before_check CHECK ((cumulative_before >= 0)),
    CONSTRAINT loan_penalty_assessments_currency_check CHECK ((currency = 'NGN'::bpchar)),
    CONSTRAINT loan_penalty_assessments_grace_period_days_check CHECK ((grace_period_days >= 0)),
    CONSTRAINT loan_penalty_assessments_penalty_frequency_check CHECK (((penalty_frequency)::text = ANY (ARRAY[('ONCE'::character varying)::text, ('DAILY'::character varying)::text, ('WEEKLY'::character varying)::text, ('MONTHLY'::character varying)::text]))),
    CONSTRAINT loan_penalty_assessments_penalty_type_check CHECK (((penalty_type)::text = ANY (ARRAY[('FIXED'::character varying)::text, ('PERCENTAGE'::character varying)::text]))),
    CONSTRAINT loan_penalty_assessments_status_check CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('POSTING'::character varying)::text, ('POSTED'::character varying)::text, ('REVERSED'::character varying)::text, ('FAILED'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_penalty_assessments FORCE ROW LEVEL SECURITY;


--
-- Name: loan_product_fees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_product_fees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_product_id uuid NOT NULL,
    fee_type public.fee_type_enum NOT NULL,
    fee_name character varying(100) NOT NULL,
    percentage_rate numeric(18,10),
    fixed_amount bigint,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    is_capitalized boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_fee_fixed CHECK (((fixed_amount IS NULL) OR ((fixed_amount)::numeric >= (0)::numeric))),
    CONSTRAINT chk_fee_percentage CHECK (((percentage_rate IS NULL) OR (percentage_rate >= (0)::numeric))),
    CONSTRAINT chk_fee_value CHECK ((((percentage_rate IS NOT NULL) AND (fixed_amount IS NULL)) OR ((percentage_rate IS NULL) AND (fixed_amount IS NOT NULL))))
);

ALTER TABLE ONLY public.loan_product_fees FORCE ROW LEVEL SECURITY;


--
-- Name: loan_product_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_product_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_product_id uuid NOT NULL,
    rule_code character varying(100) NOT NULL,
    rule_name character varying(200) NOT NULL,
    rule_type character varying(50) NOT NULL,
    configuration jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_mandatory boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.loan_product_rules FORCE ROW LEVEL SECURITY;


--
-- Name: loan_product_tiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_product_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_product_id uuid NOT NULL,
    tier_code character varying(50) NOT NULL,
    min_amount bigint,
    max_amount bigint,
    interest_rate numeric(18,10),
    max_active_loans integer,
    max_total_exposure bigint,
    max_tenure_days integer,
    eligibility_rules jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_product_tier_amount CHECK (((min_amount IS NULL) OR (max_amount IS NULL) OR (max_amount >= min_amount)))
);

ALTER TABLE ONLY public.loan_product_tiers FORCE ROW LEVEL SECURITY;


--
-- Name: loan_product_version_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_product_version_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_product_id uuid NOT NULL,
    product_version_id uuid NOT NULL,
    previous_status character varying(30),
    new_status character varying(30) NOT NULL,
    approval_id uuid,
    actor_id uuid,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.loan_product_version_history FORCE ROW LEVEL SECURITY;


--
-- Name: loan_product_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_product_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_product_id uuid NOT NULL,
    version_number integer NOT NULL,
    product_code character varying(50) NOT NULL,
    product_name character varying(150) NOT NULL,
    product_type public.loan_product_type_enum NOT NULL,
    currency character(3) NOT NULL,
    min_amount bigint NOT NULL,
    max_amount bigint NOT NULL,
    min_tenure_days integer NOT NULL,
    max_tenure_days integer NOT NULL,
    interest_rate numeric(18,10) NOT NULL,
    interest_rate_period public.interest_rate_period_enum NOT NULL,
    interest_type public.interest_type_enum NOT NULL,
    interest_payment_method public.interest_payment_method_enum NOT NULL,
    repayment_frequency public.repayment_frequency_enum NOT NULL,
    grace_period_days integer DEFAULT 0 NOT NULL,
    day_count_convention character varying(20) DEFAULT 'ACTUAL_365'::character varying NOT NULL,
    repayment_allocation_order jsonb NOT NULL,
    requires_collateral boolean DEFAULT false NOT NULL,
    requires_salary_verification boolean DEFAULT false NOT NULL,
    auto_approval_enabled boolean DEFAULT false NOT NULL,
    product_configuration jsonb DEFAULT '{}'::jsonb NOT NULL,
    tier_snapshot jsonb DEFAULT '[]'::jsonb NOT NULL,
    fee_snapshot jsonb DEFAULT '[]'::jsonb NOT NULL,
    rule_snapshot jsonb DEFAULT '[]'::jsonb NOT NULL,
    effective_from timestamp with time zone NOT NULL,
    effective_to timestamp with time zone,
    is_current boolean DEFAULT true NOT NULL,
    published_at timestamp with time zone,
    published_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(30) DEFAULT 'DRAFT'::character varying NOT NULL,
    approval_id uuid,
    idempotency_key character varying(255),
    request_hash character(64),
    configuration_hash character(64) NOT NULL,
    calculation_policy_version character varying(50) DEFAULT 'LENDING_CALC_V1'::character varying NOT NULL,
    rounding_mode character varying(30) DEFAULT 'HALF_EVEN'::character varying NOT NULL,
    minor_unit_scale smallint DEFAULT 2 NOT NULL,
    calculation_timezone character varying(64) DEFAULT 'Africa/Lagos'::character varying NOT NULL,
    repayment_grace_period_days integer DEFAULT 0 NOT NULL,
    late_payment_grace_period_days integer DEFAULT 0 NOT NULL,
    penalty_type character varying(20),
    penalty_rate numeric(18,10),
    penalty_fixed_amount bigint,
    penalty_cap_amount bigint,
    penalty_frequency character varying(20),
    penalty_compounds boolean DEFAULT false NOT NULL,
    daily_reducing_enabled boolean DEFAULT false NOT NULL,
    collateral_valuation_ready boolean DEFAULT false NOT NULL,
    insurance_ready boolean DEFAULT false NOT NULL,
    vendor_payment_ready boolean DEFAULT false NOT NULL,
    repossession_ready boolean DEFAULT false NOT NULL,
    legal_process_ready boolean DEFAULT false NOT NULL,
    activated_for_tenant boolean DEFAULT false NOT NULL,
    delinquency_buckets jsonb DEFAULT '[{"code": "CURRENT", "minimum_dpd": 0}, {"code": "WATCH", "minimum_dpd": 1}, {"code": "DELINQUENT", "minimum_dpd": 30}, {"code": "DEFAULT", "minimum_dpd": 90}]'::jsonb NOT NULL,
    writeoff_eligibility jsonb DEFAULT '{"minimum_dpd": 90}'::jsonb NOT NULL,
    CONSTRAINT chk_daily_reducing_activation CHECK (((interest_type <> 'DAILY_REDUCING_BALANCE'::public.interest_type_enum) OR daily_reducing_enabled)),
    CONSTRAINT chk_penalty_configuration CHECK ((((penalty_type IS NULL) AND (penalty_rate IS NULL) AND (penalty_fixed_amount IS NULL) AND (penalty_frequency IS NULL)) OR (((penalty_type)::text = 'FIXED'::text) AND (penalty_fixed_amount IS NOT NULL) AND (penalty_rate IS NULL) AND (penalty_frequency IS NOT NULL)) OR (((penalty_type)::text = 'PERCENTAGE'::text) AND (penalty_rate IS NOT NULL) AND (penalty_fixed_amount IS NULL) AND (penalty_frequency IS NOT NULL)))),
    CONSTRAINT chk_product_version_allocation CHECK (public.valid_allocation_order(repayment_allocation_order)),
    CONSTRAINT chk_product_version_amount CHECK ((((min_amount)::numeric > (0)::numeric) AND (max_amount >= min_amount))),
    CONSTRAINT chk_product_version_currency CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT chk_product_version_dates CHECK (((effective_to IS NULL) OR (effective_to > effective_from))),
    CONSTRAINT chk_product_version_delinquency_buckets CHECK (public.valid_delinquency_buckets(delinquency_buckets)),
    CONSTRAINT chk_product_version_ngn_publish CHECK ((((status)::text <> 'PUBLISHED'::text) OR (currency = 'NGN'::bpchar))),
    CONSTRAINT chk_product_version_rate CHECK ((interest_rate >= (0)::numeric)),
    CONSTRAINT chk_product_version_tenure CHECK (((min_tenure_days > 0) AND (max_tenure_days >= min_tenure_days))),
    CONSTRAINT chk_publication_evidence CHECK ((((status)::text <> ALL (ARRAY[('PUBLISHED'::character varying)::text, ('RETIRED'::character varying)::text])) OR ((approval_id IS NOT NULL) AND (published_at IS NOT NULL) AND (published_by IS NOT NULL)))),
    CONSTRAINT chk_secured_readiness CHECK ((((status)::text <> 'PUBLISHED'::text) OR (product_type <> ALL (ARRAY['SECURED'::public.loan_product_type_enum, 'ASSET_FINANCE'::public.loan_product_type_enum])) OR (requires_collateral AND collateral_valuation_ready AND insurance_ready AND vendor_payment_ready AND repossession_ready AND legal_process_ready))),
    CONSTRAINT chk_writeoff_eligibility CHECK (((jsonb_typeof(writeoff_eligibility) = 'object'::text) AND jsonb_exists(writeoff_eligibility, 'minimum_dpd'::text) AND ((writeoff_eligibility ->> 'minimum_dpd'::text) ~ '^[0-9]+$'::text))),
    CONSTRAINT loan_product_versions_late_payment_grace_period_days_check CHECK ((late_payment_grace_period_days >= 0)),
    CONSTRAINT loan_product_versions_minor_unit_scale_check CHECK (((minor_unit_scale >= 0) AND (minor_unit_scale <= 6))),
    CONSTRAINT loan_product_versions_penalty_cap_amount_check CHECK (((penalty_cap_amount IS NULL) OR (penalty_cap_amount >= 0))),
    CONSTRAINT loan_product_versions_penalty_fixed_amount_check CHECK (((penalty_fixed_amount IS NULL) OR (penalty_fixed_amount >= 0))),
    CONSTRAINT loan_product_versions_penalty_frequency_check CHECK (((penalty_frequency)::text = ANY (ARRAY[('ONCE'::character varying)::text, ('DAILY'::character varying)::text, ('WEEKLY'::character varying)::text, ('MONTHLY'::character varying)::text]))),
    CONSTRAINT loan_product_versions_penalty_rate_check CHECK (((penalty_rate IS NULL) OR (penalty_rate >= (0)::numeric))),
    CONSTRAINT loan_product_versions_penalty_type_check CHECK (((penalty_type)::text = ANY (ARRAY[('FIXED'::character varying)::text, ('PERCENTAGE'::character varying)::text]))),
    CONSTRAINT loan_product_versions_repayment_grace_period_days_check CHECK ((repayment_grace_period_days >= 0)),
    CONSTRAINT loan_product_versions_rounding_mode_check CHECK (((rounding_mode)::text = ANY (ARRAY[('HALF_EVEN'::character varying)::text, ('HALF_UP'::character varying)::text, ('DOWN'::character varying)::text]))),
    CONSTRAINT loan_product_versions_status_check CHECK (((status)::text = ANY (ARRAY[('DRAFT'::character varying)::text, ('PENDING_APPROVAL'::character varying)::text, ('PUBLISHED'::character varying)::text, ('RETIRED'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_product_versions FORCE ROW LEVEL SECURITY;


--
-- Name: loan_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    product_code character varying(50) NOT NULL,
    product_name character varying(150) NOT NULL,
    product_type public.loan_product_type_enum NOT NULL,
    description text,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    min_amount bigint,
    max_amount bigint,
    min_tenure_days integer,
    max_tenure_days integer,
    interest_rate numeric(18,10),
    interest_type public.interest_type_enum,
    repayment_frequency public.repayment_frequency_enum,
    interest_payment_method public.interest_payment_method_enum DEFAULT 'AMORTIZED'::public.interest_payment_method_enum NOT NULL,
    grace_period_days integer DEFAULT 0 NOT NULL,
    requires_collateral boolean DEFAULT false NOT NULL,
    requires_salary_verification boolean DEFAULT false NOT NULL,
    auto_approval_enabled boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    configuration jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp with time zone,
    interest_rate_period public.interest_rate_period_enum DEFAULT 'ANNUAL'::public.interest_rate_period_enum NOT NULL,
    day_count_convention character varying(20) DEFAULT 'ACTUAL_365'::character varying NOT NULL,
    repayment_allocation_order jsonb DEFAULT '["PENALTY", "FEES", "INTEREST", "PRINCIPAL"]'::jsonb NOT NULL,
    lifecycle_status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    idempotency_key character varying(255),
    request_hash character(64),
    CONSTRAINT chk_product_allocation CHECK (public.valid_allocation_order(repayment_allocation_order)),
    CONSTRAINT chk_product_amount CHECK ((((min_amount)::numeric > (0)::numeric) AND (max_amount >= min_amount))),
    CONSTRAINT chk_product_currency CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT chk_product_day_count CHECK (((day_count_convention)::text = ANY (ARRAY[('ACTUAL_365'::character varying)::text, ('ACTUAL_360'::character varying)::text, ('THIRTY_360'::character varying)::text, ('ACTUAL_ACTUAL'::character varying)::text]))),
    CONSTRAINT chk_product_grace CHECK ((grace_period_days >= 0)),
    CONSTRAINT chk_product_interest CHECK ((interest_rate >= (0)::numeric)),
    CONSTRAINT chk_product_tenure CHECK (((min_tenure_days > 0) AND (max_tenure_days >= min_tenure_days))),
    CONSTRAINT loan_products_lifecycle_status_check CHECK (((lifecycle_status)::text = ANY (ARRAY[('DRAFT'::character varying)::text, ('ACTIVE'::character varying)::text, ('RETIRED'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_products FORCE ROW LEVEL SECURITY;


--
-- Name: loan_quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    product_version_id uuid NOT NULL,
    amount bigint NOT NULL,
    currency character(3) NOT NULL,
    tenure_days integer NOT NULL,
    repayment_frequency character varying(30) NOT NULL,
    purpose text,
    customer_inputs jsonb DEFAULT '{}'::jsonb NOT NULL,
    total_interest bigint NOT NULL,
    total_fees bigint NOT NULL,
    total_repayable bigint NOT NULL,
    maturity_date date NOT NULL,
    schedule jsonb NOT NULL,
    configuration_hash character(64) NOT NULL,
    calculation_policy_version character varying(100) NOT NULL,
    calculation_input_hash character(64) NOT NULL,
    calculation_output_hash character(64) NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    request_hash character(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT loan_quotes_amount_check CHECK ((amount > 0)),
    CONSTRAINT loan_quotes_check CHECK ((total_repayable = ((amount + total_interest) + total_fees))),
    CONSTRAINT loan_quotes_currency_check CHECK ((currency = 'NGN'::bpchar)),
    CONSTRAINT loan_quotes_customer_inputs_check CHECK ((jsonb_typeof(customer_inputs) = 'object'::text)),
    CONSTRAINT loan_quotes_schedule_check CHECK ((jsonb_typeof(schedule) = 'array'::text)),
    CONSTRAINT loan_quotes_tenure_days_check CHECK ((tenure_days > 0)),
    CONSTRAINT loan_quotes_total_fees_check CHECK ((total_fees >= 0)),
    CONSTRAINT loan_quotes_total_interest_check CHECK ((total_interest >= 0))
);

ALTER TABLE ONLY public.loan_quotes FORCE ROW LEVEL SECURITY;


--
-- Name: loan_repayment_allocation_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_repayment_allocation_batches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    repayment_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    product_version_id uuid NOT NULL,
    status character varying(30) NOT NULL,
    amount bigint NOT NULL,
    allocated_amount bigint DEFAULT 0 NOT NULL,
    unapplied_amount bigint DEFAULT 0 NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    allocation_order jsonb NOT NULL,
    policy_hash character(64) NOT NULL,
    input_hash character(64) NOT NULL,
    output_hash character(64) NOT NULL,
    ledger_idempotency_key character varying(255) NOT NULL,
    ledger_transaction_id uuid,
    version integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_at timestamp with time zone,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT loan_repayment_allocation_batches_allocated_amount_check CHECK ((allocated_amount >= 0)),
    CONSTRAINT loan_repayment_allocation_batches_allocation_order_check CHECK (public.valid_allocation_order(allocation_order)),
    CONSTRAINT loan_repayment_allocation_batches_amount_check CHECK ((amount > 0)),
    CONSTRAINT loan_repayment_allocation_batches_check CHECK ((amount = (allocated_amount + unapplied_amount))),
    CONSTRAINT loan_repayment_allocation_batches_check1 CHECK ((((status)::text <> ALL (ARRAY[('APPLIED'::character varying)::text, ('REVERSED'::character varying)::text])) OR (ledger_transaction_id IS NOT NULL))),
    CONSTRAINT loan_repayment_allocation_batches_currency_check CHECK ((currency = 'NGN'::bpchar)),
    CONSTRAINT loan_repayment_allocation_batches_status_check CHECK (((status)::text = ANY (ARRAY[('PREPARED'::character varying)::text, ('LEDGER_POSTING'::character varying)::text, ('APPLIED'::character varying)::text, ('FAILED'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text, ('REVERSED'::character varying)::text]))),
    CONSTRAINT loan_repayment_allocation_batches_unapplied_amount_check CHECK ((unapplied_amount >= 0))
);

ALTER TABLE ONLY public.loan_repayment_allocation_batches FORCE ROW LEVEL SECURITY;


--
-- Name: loan_repayment_allocation_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_repayment_allocation_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    batch_id uuid NOT NULL,
    installment_id uuid NOT NULL,
    sequence_number integer NOT NULL,
    component character varying(20) NOT NULL,
    amount bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loan_repayment_allocation_lines_amount_check CHECK ((amount > 0)),
    CONSTRAINT loan_repayment_allocation_lines_component_check CHECK (((component)::text = ANY (ARRAY[('PENALTY'::character varying)::text, ('FEES'::character varying)::text, ('INTEREST'::character varying)::text, ('PRINCIPAL'::character varying)::text]))),
    CONSTRAINT loan_repayment_allocation_lines_sequence_number_check CHECK ((sequence_number > 0))
);

ALTER TABLE ONLY public.loan_repayment_allocation_lines FORCE ROW LEVEL SECURITY;


--
-- Name: loan_repayment_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_repayment_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    repayment_id uuid NOT NULL,
    installment_id uuid,
    principal_amount bigint DEFAULT 0 NOT NULL,
    interest_amount bigint DEFAULT 0 NOT NULL,
    fee_amount bigint DEFAULT 0 NOT NULL,
    penalty_amount bigint DEFAULT 0 NOT NULL,
    total_amount bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_allocation_amounts CHECK ((((principal_amount)::numeric >= (0)::numeric) AND ((interest_amount)::numeric >= (0)::numeric) AND ((fee_amount)::numeric >= (0)::numeric) AND ((penalty_amount)::numeric >= (0)::numeric) AND ((total_amount)::numeric >= (0)::numeric))),
    CONSTRAINT chk_allocation_total_components CHECK ((total_amount = (((principal_amount + interest_amount) + fee_amount) + penalty_amount)))
);

ALTER TABLE ONLY public.loan_repayment_allocations FORCE ROW LEVEL SECURITY;


--
-- Name: loan_repayment_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_repayment_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    repayment_id uuid,
    attempt_number integer NOT NULL,
    amount bigint NOT NULL,
    method public.repayment_method_enum NOT NULL,
    status public.repayment_status_enum DEFAULT 'PENDING'::public.repayment_status_enum NOT NULL,
    provider_code character varying(100),
    provider_reference character varying(200),
    payment_transaction_id uuid,
    failure_code character varying(100),
    failure_reason text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_repayment_attempt_amount CHECK (((amount)::numeric > (0)::numeric))
);

ALTER TABLE ONLY public.loan_repayment_attempts FORCE ROW LEVEL SECURITY;


--
-- Name: loan_repayment_lifecycle_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_repayment_lifecycle_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    repayment_id uuid NOT NULL,
    previous_status character varying(30),
    new_status character varying(30) NOT NULL,
    reason_code character varying(100),
    correlation_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.loan_repayment_lifecycle_history FORCE ROW LEVEL SECURITY;


--
-- Name: loan_repayment_quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_repayment_quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    amount bigint NOT NULL,
    currency character(3) NOT NULL,
    source character varying(30) NOT NULL,
    outstanding_snapshot jsonb NOT NULL,
    allocation_preview jsonb NOT NULL,
    calculation_input_hash character(64) NOT NULL,
    calculation_output_hash character(64) NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    request_hash character(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT loan_repayment_quotes_allocation_preview_check CHECK ((jsonb_typeof(allocation_preview) = 'object'::text)),
    CONSTRAINT loan_repayment_quotes_amount_check CHECK ((amount > 0)),
    CONSTRAINT loan_repayment_quotes_currency_check CHECK ((currency = 'NGN'::bpchar)),
    CONSTRAINT loan_repayment_quotes_outstanding_snapshot_check CHECK ((jsonb_typeof(outstanding_snapshot) = 'object'::text)),
    CONSTRAINT loan_repayment_quotes_source_check CHECK (((source)::text = ANY (ARRAY[('WALLET'::character varying)::text, ('DIRECT_DEBIT'::character varying)::text, ('VIRTUAL_ACCOUNT'::character varying)::text, ('MANUAL_BANK_TRANSFER'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_repayment_quotes FORCE ROW LEVEL SECURITY;


--
-- Name: loan_repayment_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_repayment_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    repayment_quote_id uuid NOT NULL,
    status character varying(30) NOT NULL,
    authorization_reference character varying(255),
    authorization_evidence_hash character(64),
    collection_reference character varying(255),
    payment_request_id uuid,
    payment_correlation_id uuid NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    request_hash character(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT loan_repayment_requests_check CHECK (((authorization_reference IS NULL) = (authorization_evidence_hash IS NULL))),
    CONSTRAINT loan_repayment_requests_status_check CHECK (((status)::text = ANY (ARRAY[('SUBMITTING'::character varying)::text, ('PENDING_COLLECTION'::character varying)::text, ('PENDING_MATCH'::character varying)::text, ('CONFIRMED'::character varying)::text, ('FAILED'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_repayment_requests FORCE ROW LEVEL SECURITY;


--
-- Name: loan_repayment_reversals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_repayment_reversals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    repayment_id uuid NOT NULL,
    allocation_batch_id uuid NOT NULL,
    reversal_of_id uuid,
    reason character varying(500) NOT NULL,
    authority_type character varying(30) NOT NULL,
    authority_id uuid NOT NULL,
    authority_payload_hash character(64) NOT NULL,
    ledger_transaction_id uuid,
    status character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    posted_at timestamp with time zone,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT loan_repayment_reversals_authority_type_check CHECK (((authority_type)::text = ANY (ARRAY[('APPROVAL'::character varying)::text, ('AUTOMATED_RULE'::character varying)::text]))),
    CONSTRAINT loan_repayment_reversals_status_check CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('POSTED'::character varying)::text, ('FAILED'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_repayment_reversals FORCE ROW LEVEL SECURITY;


--
-- Name: loan_repayments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_repayments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    repayment_reference character varying(100) NOT NULL,
    amount bigint NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    method public.repayment_method_enum NOT NULL,
    status character varying(30) DEFAULT 'PENDING'::public.repayment_status_enum NOT NULL,
    payment_transaction_id uuid,
    ledger_transaction_id uuid,
    received_at timestamp with time zone,
    processed_at timestamp with time zone,
    failure_reason text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid,
    idempotency_key character varying(255),
    request_hash character(64),
    correlation_id uuid,
    causation_id uuid,
    source_event_id uuid,
    source_event_type character varying(150),
    source_payload_hash character(64),
    allocation_policy_hash character(64),
    ledger_idempotency_key character varying(255),
    version integer DEFAULT 0 NOT NULL,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_repayment_amount CHECK (((amount)::numeric > (0)::numeric)),
    CONSTRAINT chk_repayment_ngn CHECK ((currency = 'NGN'::bpchar)),
    CONSTRAINT chk_repayment_source_evidence CHECK (((source_event_id IS NOT NULL) AND (source_event_type IS NOT NULL) AND (source_payload_hash IS NOT NULL) AND (correlation_id IS NOT NULL) AND (causation_id IS NOT NULL))),
    CONSTRAINT chk_repayment_state CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('PROCESSING'::character varying)::text, ('LEDGER_POSTING'::character varying)::text, ('SUCCESSFUL'::character varying)::text, ('FAILED'::character varying)::text, ('REVERSED'::character varying)::text, ('REFUNDED'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_repayments FORCE ROW LEVEL SECURITY;


--
-- Name: loan_restructure_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_restructure_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    restructure_id uuid NOT NULL,
    previous_status character varying(25),
    new_status character varying(25) NOT NULL,
    actor_id uuid,
    reason_code character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.loan_restructure_history FORCE ROW LEVEL SECURITY;


--
-- Name: loan_restructures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_restructures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    previous_schedule_id uuid,
    new_schedule_id uuid,
    reason text NOT NULL,
    previous_principal bigint,
    new_principal bigint,
    previous_interest_rate numeric(18,10),
    new_interest_rate numeric(18,10),
    previous_maturity_date date,
    new_maturity_date date,
    status character varying(25) DEFAULT 'REQUESTED'::public.restructure_status_enum NOT NULL,
    requested_by uuid,
    approved_by uuid,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    approved_at timestamp with time zone,
    implemented_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    previous_balance_snapshot jsonb,
    proposed_terms jsonb,
    calculation_policy_version character varying(50),
    calculation_input_hash character(64),
    calculation_output_hash character(64),
    configuration_hash character(64),
    unrounded_total_interest numeric(30,12),
    rounding_mode character varying(30),
    day_count_convention character varying(20),
    capitalization_authorized boolean DEFAULT false NOT NULL,
    approval_id uuid,
    approval_payload_hash character(64),
    approval_consumed_at timestamp with time zone,
    approval_maker_id uuid,
    approval_checker_ids jsonb,
    approved_authority_level integer,
    executor_id uuid,
    idempotency_key character varying(255),
    request_hash character(64),
    correlation_id uuid,
    ledger_idempotency_key character varying(255),
    ledger_transaction_id uuid,
    version integer DEFAULT 0 NOT NULL,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_restructure_approval CHECK ((((status)::text = ANY (ARRAY[('REQUESTED'::character varying)::text, ('APPROVAL_PENDING'::character varying)::text, ('REJECTED'::character varying)::text, ('CANCELLED'::character varying)::text])) OR ((approval_id IS NOT NULL) AND (approval_payload_hash IS NOT NULL) AND (approval_consumed_at IS NOT NULL) AND (approval_maker_id IS NOT NULL) AND (jsonb_array_length(approval_checker_ids) > 0) AND (approved_authority_level >= 2) AND (executor_id IS NOT NULL) AND (executor_id <> approval_maker_id)))),
    CONSTRAINT chk_restructure_evidence CHECK ((((status)::text <> ALL (ARRAY[('APPROVED'::character varying)::text, ('LEDGER_POSTING'::character varying)::text, ('IMPLEMENTED'::character varying)::text])) OR ((previous_balance_snapshot IS NOT NULL) AND (proposed_terms IS NOT NULL) AND (calculation_policy_version IS NOT NULL) AND (calculation_input_hash IS NOT NULL) AND (calculation_output_hash IS NOT NULL) AND (configuration_hash IS NOT NULL) AND (unrounded_total_interest IS NOT NULL) AND (rounding_mode IS NOT NULL) AND (day_count_convention IS NOT NULL)))),
    CONSTRAINT chk_restructure_ledger CHECK ((((status)::text <> 'IMPLEMENTED'::text) OR (ledger_transaction_id IS NOT NULL))),
    CONSTRAINT chk_restructure_status CHECK (((status)::text = ANY (ARRAY[('REQUESTED'::character varying)::text, ('APPROVAL_PENDING'::character varying)::text, ('APPROVED'::character varying)::text, ('LEDGER_POSTING'::character varying)::text, ('IMPLEMENTED'::character varying)::text, ('REJECTED'::character varying)::text, ('CANCELLED'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_restructures FORCE ROW LEVEL SECURITY;


--
-- Name: loan_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    schedule_version integer DEFAULT 1 NOT NULL,
    effective_date date NOT NULL,
    total_principal bigint NOT NULL,
    total_interest bigint NOT NULL,
    total_fees bigint DEFAULT 0 NOT NULL,
    total_amount bigint NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    offer_schedule_id uuid,
    calculation_version character varying(50),
    calculation_input_hash character(64),
    calculation_output_hash character(64),
    rounding_mode character varying(30),
    day_count_convention character varying(20),
    unrounded_total_interest numeric(30,12),
    rounding_residual bigint DEFAULT 0 NOT NULL,
    CONSTRAINT chk_schedule_amounts CHECK ((((total_principal)::numeric >= (0)::numeric) AND ((total_interest)::numeric >= (0)::numeric) AND ((total_fees)::numeric >= (0)::numeric) AND ((total_amount)::numeric >= (0)::numeric))),
    CONSTRAINT chk_schedule_total_components CHECK ((total_amount = ((total_principal + total_interest) + total_fees)))
);

ALTER TABLE ONLY public.loan_schedules FORCE ROW LEVEL SECURITY;


--
-- Name: loan_servicing_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_servicing_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    run_date date NOT NULL,
    run_type character varying(30) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    checkpoint_loan_id uuid,
    attempt_count integer DEFAULT 0 NOT NULL,
    lease_expires_at timestamp with time zone,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loan_servicing_runs_attempt_count_check CHECK ((attempt_count >= 0)),
    CONSTRAINT loan_servicing_runs_run_type_check CHECK (((run_type)::text = ANY (ARRAY[('INTEREST_ACCRUAL'::character varying)::text, ('PENALTY'::character varying)::text, ('DELINQUENCY'::character varying)::text, ('ALL'::character varying)::text]))),
    CONSTRAINT loan_servicing_runs_status_check CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('RUNNING'::character varying)::text, ('COMPLETED'::character varying)::text, ('FAILED'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_servicing_runs FORCE ROW LEVEL SECURITY;


--
-- Name: loan_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    previous_status public.loan_status_enum,
    new_status public.loan_status_enum NOT NULL,
    reason text,
    changed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.loan_status_history FORCE ROW LEVEL SECURITY;


--
-- Name: loan_unapplied_credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_unapplied_credits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    repayment_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    amount bigint NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    ledger_account_id uuid NOT NULL,
    ledger_transaction_id uuid NOT NULL,
    status character varying(20) DEFAULT 'AVAILABLE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT loan_unapplied_credits_amount_check CHECK ((amount > 0)),
    CONSTRAINT loan_unapplied_credits_currency_check CHECK ((currency = 'NGN'::bpchar)),
    CONSTRAINT loan_unapplied_credits_status_check CHECK (((status)::text = ANY (ARRAY[('AVAILABLE'::character varying)::text, ('APPLIED'::character varying)::text, ('REFUNDED'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_unapplied_credits FORCE ROW LEVEL SECURITY;


--
-- Name: loan_write_off_recoveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_write_off_recoveries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    write_off_id uuid NOT NULL,
    repayment_id uuid,
    recovery_reference character varying(100) NOT NULL,
    amount bigint NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    method public.repayment_method_enum NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::public.writeoff_recovery_status_enum NOT NULL,
    payment_transaction_id uuid,
    ledger_posting_request_id uuid,
    ledger_transaction_id uuid,
    received_at timestamp with time zone,
    posted_at timestamp with time zone,
    reversal_of_id uuid,
    reversed_at timestamp with time zone,
    failure_reason text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    idempotency_key character varying(255),
    request_hash character(64),
    correlation_id uuid,
    causation_id uuid,
    source_event_id uuid,
    source_payload_hash character(64),
    allocation_snapshot jsonb,
    ledger_idempotency_key character varying(255),
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_recovery_amount CHECK (((amount)::numeric > (0)::numeric)),
    CONSTRAINT chk_recovery_currency CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT chk_recovery_evidence CHECK ((((status)::text = 'PENDING'::text) OR ((idempotency_key IS NOT NULL) AND (request_hash IS NOT NULL) AND (correlation_id IS NOT NULL) AND (source_event_id IS NOT NULL) AND (source_payload_hash IS NOT NULL)))),
    CONSTRAINT chk_recovery_ledger CHECK ((((status)::text <> ALL (ARRAY[('POSTED'::character varying)::text, ('REVERSED'::character varying)::text])) OR (ledger_transaction_id IS NOT NULL))),
    CONSTRAINT chk_recovery_ngn CHECK ((currency = 'NGN'::bpchar)),
    CONSTRAINT chk_recovery_status CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('PROCESSING'::character varying)::text, ('LEDGER_POSTING'::character varying)::text, ('POSTED'::character varying)::text, ('FAILED'::character varying)::text, ('REVERSED'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text])))
);

ALTER TABLE ONLY public.loan_write_off_recoveries FORCE ROW LEVEL SECURITY;


--
-- Name: loan_write_offs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_write_offs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    principal_amount bigint DEFAULT 0 NOT NULL,
    interest_amount bigint DEFAULT 0 NOT NULL,
    fees_amount bigint DEFAULT 0 NOT NULL,
    penalties_amount bigint DEFAULT 0 NOT NULL,
    total_amount bigint NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    reason text NOT NULL,
    status character varying(25) DEFAULT 'PENDING'::public.writeoff_status_enum NOT NULL,
    ledger_transaction_id uuid,
    requested_by uuid,
    approved_by uuid,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    product_version_id uuid,
    eligibility_snapshot jsonb,
    balance_snapshot_hash character(64),
    approval_id uuid,
    approval_payload_hash character(64),
    approval_consumed_at timestamp with time zone,
    approval_maker_id uuid,
    approval_checker_ids jsonb,
    approved_authority_level integer,
    executor_id uuid,
    idempotency_key character varying(255),
    request_hash character(64),
    correlation_id uuid,
    ledger_idempotency_key character varying(255),
    reversal_ledger_transaction_id uuid,
    recovered_amount bigint DEFAULT 0 NOT NULL,
    retention_until date DEFAULT (CURRENT_DATE + 2557) NOT NULL,
    legal_hold boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_writeoff_amount CHECK (((total_amount)::numeric > (0)::numeric)),
    CONSTRAINT chk_writeoff_approval CHECK ((((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('APPROVAL_PENDING'::character varying)::text, ('REJECTED'::character varying)::text])) OR ((approval_id IS NOT NULL) AND (approval_payload_hash IS NOT NULL) AND (approval_consumed_at IS NOT NULL) AND (approval_maker_id IS NOT NULL) AND (jsonb_array_length(approval_checker_ids) > 0) AND (approved_authority_level >= 2) AND (executor_id IS NOT NULL) AND (executor_id <> approval_maker_id)))),
    CONSTRAINT chk_writeoff_evidence CHECK ((((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('APPROVAL_PENDING'::character varying)::text, ('REJECTED'::character varying)::text])) OR ((product_version_id IS NOT NULL) AND (eligibility_snapshot IS NOT NULL) AND (balance_snapshot_hash IS NOT NULL)))),
    CONSTRAINT chk_writeoff_ledger CHECK ((((status)::text <> ALL (ARRAY[('COMPLETED'::character varying)::text, ('REVERSED'::character varying)::text])) OR (ledger_transaction_id IS NOT NULL))),
    CONSTRAINT chk_writeoff_ngn CHECK ((currency = 'NGN'::bpchar)),
    CONSTRAINT chk_writeoff_recovered CHECK (((recovered_amount >= 0) AND (recovered_amount <= total_amount))),
    CONSTRAINT chk_writeoff_status CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('APPROVAL_PENDING'::character varying)::text, ('APPROVED'::character varying)::text, ('LEDGER_POSTING'::character varying)::text, ('COMPLETED'::character varying)::text, ('REVERSED'::character varying)::text, ('REJECTED'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text]))),
    CONSTRAINT chk_writeoff_total_components CHECK ((total_amount = (((principal_amount + interest_amount) + fees_amount) + penalties_amount)))
);

ALTER TABLE ONLY public.loan_write_offs FORCE ROW LEVEL SECURITY;


--
-- Name: loan_writeoff_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_writeoff_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    writeoff_id uuid NOT NULL,
    previous_status character varying(25),
    new_status character varying(25) NOT NULL,
    actor_id uuid,
    reason_code character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.loan_writeoff_history FORCE ROW LEVEL SECURITY;


--
-- Name: loans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    application_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    loan_product_id uuid NOT NULL,
    loan_number character varying(100) NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    principal_amount bigint NOT NULL,
    approved_amount bigint NOT NULL,
    interest_rate numeric(18,10) NOT NULL,
    interest_type public.interest_type_enum NOT NULL,
    tenure_days integer NOT NULL,
    repayment_frequency public.repayment_frequency_enum NOT NULL,
    status public.loan_status_enum DEFAULT 'APPROVED'::public.loan_status_enum NOT NULL,
    disbursed_amount bigint DEFAULT 0 NOT NULL,
    outstanding_principal bigint DEFAULT 0 NOT NULL,
    outstanding_interest bigint DEFAULT 0 NOT NULL,
    outstanding_fees bigint DEFAULT 0 NOT NULL,
    outstanding_penalties bigint DEFAULT 0 NOT NULL,
    total_repaid bigint DEFAULT 0 NOT NULL,
    disbursement_date date,
    maturity_date date,
    next_payment_date date,
    closed_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_at timestamp with time zone,
    loan_product_version_id uuid,
    accepted_offer_id uuid,
    interest_rate_period public.interest_rate_period_enum DEFAULT 'ANNUAL'::public.interest_rate_period_enum NOT NULL,
    interest_payment_method public.interest_payment_method_enum DEFAULT 'AMORTIZED'::public.interest_payment_method_enum NOT NULL,
    day_count_convention character varying(20) DEFAULT 'ACTUAL_365'::character varying NOT NULL,
    first_payment_date date,
    last_repayment_date date,
    accrued_through_date date,
    days_past_due integer DEFAULT 0 NOT NULL,
    delinquency_bucket character varying(30),
    CONSTRAINT chk_loan_approved CHECK (((approved_amount)::numeric > (0)::numeric)),
    CONSTRAINT chk_loan_currency CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT chk_loan_days_past_due CHECK ((days_past_due >= 0)),
    CONSTRAINT chk_loan_interest CHECK ((interest_rate >= (0)::numeric)),
    CONSTRAINT chk_loan_ngn CHECK ((currency = 'NGN'::bpchar)),
    CONSTRAINT chk_loan_outstanding CHECK ((((outstanding_principal)::numeric >= (0)::numeric) AND ((outstanding_interest)::numeric >= (0)::numeric) AND ((outstanding_fees)::numeric >= (0)::numeric) AND ((outstanding_penalties)::numeric >= (0)::numeric) AND ((total_repaid)::numeric >= (0)::numeric))),
    CONSTRAINT chk_loan_principal CHECK (((principal_amount)::numeric > (0)::numeric))
);

ALTER TABLE ONLY public.loans FORCE ROW LEVEL SECURITY;


--
-- Name: lending_ledger_posting_requests lending_ledger_posting_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lending_ledger_posting_requests
    ADD CONSTRAINT lending_ledger_posting_requests_pkey PRIMARY KEY (id);


--
-- Name: loan_adjustments loan_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_adjustments
    ADD CONSTRAINT loan_adjustments_pkey PRIMARY KEY (id);


--
-- Name: loan_application_decisions loan_application_decisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_application_decisions
    ADD CONSTRAINT loan_application_decisions_pkey PRIMARY KEY (id);


--
-- Name: loan_application_documents loan_application_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_application_documents
    ADD CONSTRAINT loan_application_documents_pkey PRIMARY KEY (id);


--
-- Name: loan_application_events loan_application_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_application_events
    ADD CONSTRAINT loan_application_events_pkey PRIMARY KEY (id);


--
-- Name: loan_application_reviews loan_application_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_application_reviews
    ADD CONSTRAINT loan_application_reviews_pkey PRIMARY KEY (id);


--
-- Name: loan_applications loan_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_applications
    ADD CONSTRAINT loan_applications_pkey PRIMARY KEY (id);


--
-- Name: loan_asset_disbursements loan_asset_disbursements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_asset_disbursements
    ADD CONSTRAINT loan_asset_disbursements_pkey PRIMARY KEY (id);


--
-- Name: loan_assets loan_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_assets
    ADD CONSTRAINT loan_assets_pkey PRIMARY KEY (id);


--
-- Name: loan_automated_evaluations loan_automated_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_automated_evaluations
    ADD CONSTRAINT loan_automated_evaluations_pkey PRIMARY KEY (id);


--
-- Name: loan_automated_evaluations loan_automated_evaluations_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_automated_evaluations
    ADD CONSTRAINT loan_automated_evaluations_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_automated_evaluations loan_automated_evaluations_tenant_id_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_automated_evaluations
    ADD CONSTRAINT loan_automated_evaluations_tenant_id_idempotency_key_key UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_automated_rule_results loan_automated_rule_results_evaluation_id_rule_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_automated_rule_results
    ADD CONSTRAINT loan_automated_rule_results_evaluation_id_rule_code_key UNIQUE (evaluation_id, rule_code);


--
-- Name: loan_automated_rule_results loan_automated_rule_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_automated_rule_results
    ADD CONSTRAINT loan_automated_rule_results_pkey PRIMARY KEY (id);


--
-- Name: loan_collaterals loan_collaterals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_collaterals
    ADD CONSTRAINT loan_collaterals_pkey PRIMARY KEY (id);


--
-- Name: loan_collections loan_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_collections
    ADD CONSTRAINT loan_collections_pkey PRIMARY KEY (id);


--
-- Name: loan_contracts loan_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_contracts
    ADD CONSTRAINT loan_contracts_pkey PRIMARY KEY (id);


--
-- Name: loan_delinquency_assessments loan_delinquency_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_delinquency_assessments
    ADD CONSTRAINT loan_delinquency_assessments_pkey PRIMARY KEY (id);


--
-- Name: loan_delinquency_assessments loan_delinquency_assessments_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_delinquency_assessments
    ADD CONSTRAINT loan_delinquency_assessments_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_delinquency_assessments loan_delinquency_assessments_tenant_id_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_delinquency_assessments
    ADD CONSTRAINT loan_delinquency_assessments_tenant_id_idempotency_key_key UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_delinquency_assessments loan_delinquency_assessments_tenant_id_loan_id_assessment_d_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_delinquency_assessments
    ADD CONSTRAINT loan_delinquency_assessments_tenant_id_loan_id_assessment_d_key UNIQUE (tenant_id, loan_id, assessment_date);


--
-- Name: loan_direct_debit_mandates loan_direct_debit_mandates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_direct_debit_mandates
    ADD CONSTRAINT loan_direct_debit_mandates_pkey PRIMARY KEY (id);


--
-- Name: loan_disbursement_saga_steps loan_disbursement_saga_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_disbursement_saga_steps
    ADD CONSTRAINT loan_disbursement_saga_steps_pkey PRIMARY KEY (id);


--
-- Name: loan_disbursement_saga_steps loan_disbursement_saga_steps_tenant_id_disbursement_id_step_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_disbursement_saga_steps
    ADD CONSTRAINT loan_disbursement_saga_steps_tenant_id_disbursement_id_step_key UNIQUE (tenant_id, disbursement_id, step_type, attempt_number);


--
-- Name: loan_disbursement_saga_steps loan_disbursement_saga_steps_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_disbursement_saga_steps
    ADD CONSTRAINT loan_disbursement_saga_steps_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_disbursement_saga_steps loan_disbursement_saga_steps_tenant_id_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_disbursement_saga_steps
    ADD CONSTRAINT loan_disbursement_saga_steps_tenant_id_idempotency_key_key UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_disbursements loan_disbursements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_disbursements
    ADD CONSTRAINT loan_disbursements_pkey PRIMARY KEY (id);


--
-- Name: loan_idempotency_keys loan_idempotency_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_idempotency_keys
    ADD CONSTRAINT loan_idempotency_keys_pkey PRIMARY KEY (id);


--
-- Name: loan_inbox_events loan_inbox_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_inbox_events
    ADD CONSTRAINT loan_inbox_events_pkey PRIMARY KEY (id);


--
-- Name: loan_installments loan_installments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_installments
    ADD CONSTRAINT loan_installments_pkey PRIMARY KEY (id);


--
-- Name: loan_interest_accruals loan_interest_accruals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_interest_accruals
    ADD CONSTRAINT loan_interest_accruals_pkey PRIMARY KEY (id);


--
-- Name: loan_manual_decision_conditions loan_manual_decision_conditio_tenant_id_recommendation_id_c_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_decision_conditions
    ADD CONSTRAINT loan_manual_decision_conditio_tenant_id_recommendation_id_c_key UNIQUE (tenant_id, recommendation_id, condition_code);


--
-- Name: loan_manual_decision_conditions loan_manual_decision_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_decision_conditions
    ADD CONSTRAINT loan_manual_decision_conditions_pkey PRIMARY KEY (id);


--
-- Name: loan_manual_decision_conditions loan_manual_decision_conditions_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_decision_conditions
    ADD CONSTRAINT loan_manual_decision_conditions_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_manual_review_assignments loan_manual_review_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_review_assignments
    ADD CONSTRAINT loan_manual_review_assignments_pkey PRIMARY KEY (id);


--
-- Name: loan_manual_review_assignments loan_manual_review_assignments_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_review_assignments
    ADD CONSTRAINT loan_manual_review_assignments_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_manual_review_assignments loan_manual_review_assignments_tenant_id_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_review_assignments
    ADD CONSTRAINT loan_manual_review_assignments_tenant_id_idempotency_key_key UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_manual_review_cases loan_manual_review_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_review_cases
    ADD CONSTRAINT loan_manual_review_cases_pkey PRIMARY KEY (id);


--
-- Name: loan_manual_review_cases loan_manual_review_cases_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_review_cases
    ADD CONSTRAINT loan_manual_review_cases_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_manual_review_recommendations loan_manual_review_recommendation_tenant_id_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_review_recommendations
    ADD CONSTRAINT loan_manual_review_recommendation_tenant_id_idempotency_key_key UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_manual_review_recommendations loan_manual_review_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_review_recommendations
    ADD CONSTRAINT loan_manual_review_recommendations_pkey PRIMARY KEY (id);


--
-- Name: loan_manual_review_recommendations loan_manual_review_recommendations_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_review_recommendations
    ADD CONSTRAINT loan_manual_review_recommendations_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_offer_acceptances loan_offer_acceptances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_acceptances
    ADD CONSTRAINT loan_offer_acceptances_pkey PRIMARY KEY (id);


--
-- Name: loan_offer_acceptances loan_offer_acceptances_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_acceptances
    ADD CONSTRAINT loan_offer_acceptances_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_offer_acceptances loan_offer_acceptances_tenant_id_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_acceptances
    ADD CONSTRAINT loan_offer_acceptances_tenant_id_idempotency_key_key UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_offer_acceptances loan_offer_acceptances_tenant_id_offer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_acceptances
    ADD CONSTRAINT loan_offer_acceptances_tenant_id_offer_id_key UNIQUE (tenant_id, offer_id);


--
-- Name: loan_offer_fee_lines loan_offer_fee_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_fee_lines
    ADD CONSTRAINT loan_offer_fee_lines_pkey PRIMARY KEY (id);


--
-- Name: loan_offer_fee_lines loan_offer_fee_lines_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_fee_lines
    ADD CONSTRAINT loan_offer_fee_lines_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_offer_fee_lines loan_offer_fee_lines_tenant_id_offer_id_fee_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_fee_lines
    ADD CONSTRAINT loan_offer_fee_lines_tenant_id_offer_id_fee_code_key UNIQUE (tenant_id, offer_id, fee_code);


--
-- Name: loan_offer_installments loan_offer_installments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_installments
    ADD CONSTRAINT loan_offer_installments_pkey PRIMARY KEY (id);


--
-- Name: loan_offer_installments loan_offer_installments_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_installments
    ADD CONSTRAINT loan_offer_installments_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_offer_installments loan_offer_installments_tenant_id_schedule_id_installment_n_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_installments
    ADD CONSTRAINT loan_offer_installments_tenant_id_schedule_id_installment_n_key UNIQUE (tenant_id, schedule_id, installment_number);


--
-- Name: loan_offer_schedules loan_offer_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_schedules
    ADD CONSTRAINT loan_offer_schedules_pkey PRIMARY KEY (id);


--
-- Name: loan_offer_schedules loan_offer_schedules_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_schedules
    ADD CONSTRAINT loan_offer_schedules_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_offer_schedules loan_offer_schedules_tenant_id_offer_id_schedule_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_schedules
    ADD CONSTRAINT loan_offer_schedules_tenant_id_offer_id_schedule_version_key UNIQUE (tenant_id, offer_id, schedule_version);


--
-- Name: loan_offers loan_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offers
    ADD CONSTRAINT loan_offers_pkey PRIMARY KEY (id);


--
-- Name: loan_outbox_events loan_outbox_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_outbox_events
    ADD CONSTRAINT loan_outbox_events_pkey PRIMARY KEY (id);


--
-- Name: loan_parties loan_parties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_parties
    ADD CONSTRAINT loan_parties_pkey PRIMARY KEY (id);


--
-- Name: loan_payment_links loan_payment_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_payment_links
    ADD CONSTRAINT loan_payment_links_pkey PRIMARY KEY (id);


--
-- Name: loan_penalty_assessments loan_penalty_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_penalty_assessments
    ADD CONSTRAINT loan_penalty_assessments_pkey PRIMARY KEY (id);


--
-- Name: loan_penalty_assessments loan_penalty_assessments_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_penalty_assessments
    ADD CONSTRAINT loan_penalty_assessments_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_penalty_assessments loan_penalty_assessments_tenant_id_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_penalty_assessments
    ADD CONSTRAINT loan_penalty_assessments_tenant_id_idempotency_key_key UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_penalty_assessments loan_penalty_assessments_tenant_id_installment_id_assessmen_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_penalty_assessments
    ADD CONSTRAINT loan_penalty_assessments_tenant_id_installment_id_assessmen_key UNIQUE (tenant_id, installment_id, assessment_period_start, assessment_period_end, penalty_frequency);


--
-- Name: loan_product_fees loan_product_fees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_fees
    ADD CONSTRAINT loan_product_fees_pkey PRIMARY KEY (id);


--
-- Name: loan_product_rules loan_product_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_rules
    ADD CONSTRAINT loan_product_rules_pkey PRIMARY KEY (id);


--
-- Name: loan_product_tiers loan_product_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_tiers
    ADD CONSTRAINT loan_product_tiers_pkey PRIMARY KEY (id);


--
-- Name: loan_product_version_history loan_product_version_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_version_history
    ADD CONSTRAINT loan_product_version_history_pkey PRIMARY KEY (id);


--
-- Name: loan_product_versions loan_product_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_versions
    ADD CONSTRAINT loan_product_versions_pkey PRIMARY KEY (id);


--
-- Name: loan_products loan_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_products
    ADD CONSTRAINT loan_products_pkey PRIMARY KEY (id);


--
-- Name: loan_quotes loan_quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_quotes
    ADD CONSTRAINT loan_quotes_pkey PRIMARY KEY (id);


--
-- Name: loan_quotes loan_quotes_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_quotes
    ADD CONSTRAINT loan_quotes_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_quotes loan_quotes_tenant_id_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_quotes
    ADD CONSTRAINT loan_quotes_tenant_id_idempotency_key_key UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_repayment_allocation_batches loan_repayment_allocation_bat_tenant_id_ledger_idempotency__key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocation_batches
    ADD CONSTRAINT loan_repayment_allocation_bat_tenant_id_ledger_idempotency__key UNIQUE (tenant_id, ledger_idempotency_key);


--
-- Name: loan_repayment_allocation_batches loan_repayment_allocation_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocation_batches
    ADD CONSTRAINT loan_repayment_allocation_batches_pkey PRIMARY KEY (id);


--
-- Name: loan_repayment_allocation_batches loan_repayment_allocation_batches_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocation_batches
    ADD CONSTRAINT loan_repayment_allocation_batches_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_repayment_allocation_batches loan_repayment_allocation_batches_tenant_id_repayment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocation_batches
    ADD CONSTRAINT loan_repayment_allocation_batches_tenant_id_repayment_id_key UNIQUE (tenant_id, repayment_id);


--
-- Name: loan_repayment_allocation_lines loan_repayment_allocation_lin_tenant_id_batch_id_installmen_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocation_lines
    ADD CONSTRAINT loan_repayment_allocation_lin_tenant_id_batch_id_installmen_key UNIQUE (tenant_id, batch_id, installment_id, component);


--
-- Name: loan_repayment_allocation_lines loan_repayment_allocation_lin_tenant_id_batch_id_sequence_n_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocation_lines
    ADD CONSTRAINT loan_repayment_allocation_lin_tenant_id_batch_id_sequence_n_key UNIQUE (tenant_id, batch_id, sequence_number);


--
-- Name: loan_repayment_allocation_lines loan_repayment_allocation_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocation_lines
    ADD CONSTRAINT loan_repayment_allocation_lines_pkey PRIMARY KEY (id);


--
-- Name: loan_repayment_allocation_lines loan_repayment_allocation_lines_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocation_lines
    ADD CONSTRAINT loan_repayment_allocation_lines_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_repayment_allocations loan_repayment_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocations
    ADD CONSTRAINT loan_repayment_allocations_pkey PRIMARY KEY (id);


--
-- Name: loan_repayment_attempts loan_repayment_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_attempts
    ADD CONSTRAINT loan_repayment_attempts_pkey PRIMARY KEY (id);


--
-- Name: loan_repayment_lifecycle_history loan_repayment_lifecycle_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_lifecycle_history
    ADD CONSTRAINT loan_repayment_lifecycle_history_pkey PRIMARY KEY (id);


--
-- Name: loan_repayment_quotes loan_repayment_quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_quotes
    ADD CONSTRAINT loan_repayment_quotes_pkey PRIMARY KEY (id);


--
-- Name: loan_repayment_quotes loan_repayment_quotes_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_quotes
    ADD CONSTRAINT loan_repayment_quotes_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_repayment_quotes loan_repayment_quotes_tenant_id_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_quotes
    ADD CONSTRAINT loan_repayment_quotes_tenant_id_idempotency_key_key UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_repayment_requests loan_repayment_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_requests
    ADD CONSTRAINT loan_repayment_requests_pkey PRIMARY KEY (id);


--
-- Name: loan_repayment_requests loan_repayment_requests_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_requests
    ADD CONSTRAINT loan_repayment_requests_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_repayment_requests loan_repayment_requests_tenant_id_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_requests
    ADD CONSTRAINT loan_repayment_requests_tenant_id_idempotency_key_key UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_repayment_reversals loan_repayment_reversals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_reversals
    ADD CONSTRAINT loan_repayment_reversals_pkey PRIMARY KEY (id);


--
-- Name: loan_repayment_reversals loan_repayment_reversals_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_reversals
    ADD CONSTRAINT loan_repayment_reversals_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_repayment_reversals loan_repayment_reversals_tenant_id_repayment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_reversals
    ADD CONSTRAINT loan_repayment_reversals_tenant_id_repayment_id_key UNIQUE (tenant_id, repayment_id);


--
-- Name: loan_repayments loan_repayments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayments
    ADD CONSTRAINT loan_repayments_pkey PRIMARY KEY (id);


--
-- Name: loan_restructure_history loan_restructure_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_restructure_history
    ADD CONSTRAINT loan_restructure_history_pkey PRIMARY KEY (id);


--
-- Name: loan_restructures loan_restructures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_restructures
    ADD CONSTRAINT loan_restructures_pkey PRIMARY KEY (id);


--
-- Name: loan_schedules loan_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_schedules
    ADD CONSTRAINT loan_schedules_pkey PRIMARY KEY (id);


--
-- Name: loan_servicing_runs loan_servicing_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_servicing_runs
    ADD CONSTRAINT loan_servicing_runs_pkey PRIMARY KEY (id);


--
-- Name: loan_servicing_runs loan_servicing_runs_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_servicing_runs
    ADD CONSTRAINT loan_servicing_runs_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_servicing_runs loan_servicing_runs_tenant_id_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_servicing_runs
    ADD CONSTRAINT loan_servicing_runs_tenant_id_idempotency_key_key UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_status_history loan_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_status_history
    ADD CONSTRAINT loan_status_history_pkey PRIMARY KEY (id);


--
-- Name: loan_unapplied_credits loan_unapplied_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_unapplied_credits
    ADD CONSTRAINT loan_unapplied_credits_pkey PRIMARY KEY (id);


--
-- Name: loan_unapplied_credits loan_unapplied_credits_tenant_id_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_unapplied_credits
    ADD CONSTRAINT loan_unapplied_credits_tenant_id_id_key UNIQUE (tenant_id, id);


--
-- Name: loan_unapplied_credits loan_unapplied_credits_tenant_id_repayment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_unapplied_credits
    ADD CONSTRAINT loan_unapplied_credits_tenant_id_repayment_id_key UNIQUE (tenant_id, repayment_id);


--
-- Name: loan_write_off_recoveries loan_write_off_recoveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_off_recoveries
    ADD CONSTRAINT loan_write_off_recoveries_pkey PRIMARY KEY (id);


--
-- Name: loan_write_offs loan_write_offs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_offs
    ADD CONSTRAINT loan_write_offs_pkey PRIMARY KEY (id);


--
-- Name: loan_writeoff_history loan_writeoff_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_writeoff_history
    ADD CONSTRAINT loan_writeoff_history_pkey PRIMARY KEY (id);


--
-- Name: loans loans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_pkey PRIMARY KEY (id);


--
-- Name: loan_interest_accruals uq_accrual_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_interest_accruals
    ADD CONSTRAINT uq_accrual_reference UNIQUE (tenant_id, accrual_reference);


--
-- Name: loan_adjustments uq_adjustment_idempotency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_adjustments
    ADD CONSTRAINT uq_adjustment_idempotency UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_adjustments uq_adjustment_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_adjustments
    ADD CONSTRAINT uq_adjustment_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_application_decisions uq_application_decision_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_application_decisions
    ADD CONSTRAINT uq_application_decision_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_applications uq_application_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_applications
    ADD CONSTRAINT uq_application_number UNIQUE (tenant_id, application_number);


--
-- Name: loan_application_reviews uq_application_review_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_application_reviews
    ADD CONSTRAINT uq_application_review_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_applications uq_applications_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_applications
    ADD CONSTRAINT uq_applications_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_contracts uq_contract_idempotency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_contracts
    ADD CONSTRAINT uq_contract_idempotency UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_contracts uq_contract_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_contracts
    ADD CONSTRAINT uq_contract_reference UNIQUE (tenant_id, contract_reference);


--
-- Name: loan_contracts uq_contract_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_contracts
    ADD CONSTRAINT uq_contract_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_contracts uq_contract_version; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_contracts
    ADD CONSTRAINT uq_contract_version UNIQUE (loan_id, contract_version);


--
-- Name: loan_disbursements uq_disbursement_idempotency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_disbursements
    ADD CONSTRAINT uq_disbursement_idempotency UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_disbursements uq_disbursement_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_disbursements
    ADD CONSTRAINT uq_disbursement_reference UNIQUE (tenant_id, disbursement_reference);


--
-- Name: loan_disbursements uq_disbursement_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_disbursements
    ADD CONSTRAINT uq_disbursement_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_inbox_events uq_inbox_source_event; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_inbox_events
    ADD CONSTRAINT uq_inbox_source_event UNIQUE (source_service, event_id);


--
-- Name: loan_installments uq_installment_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_installments
    ADD CONSTRAINT uq_installment_number UNIQUE (schedule_id, installment_number);


--
-- Name: loan_installments uq_installments_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_installments
    ADD CONSTRAINT uq_installments_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_interest_accruals uq_interest_accrual_idempotency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_interest_accruals
    ADD CONSTRAINT uq_interest_accrual_idempotency UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_interest_accruals uq_interest_accrual_period_tenant; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_interest_accruals
    ADD CONSTRAINT uq_interest_accrual_period_tenant UNIQUE (tenant_id, loan_id, period_start, period_end);


--
-- Name: loan_interest_accruals uq_interest_accrual_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_interest_accruals
    ADD CONSTRAINT uq_interest_accrual_tenant_id UNIQUE (tenant_id, id);


--
-- Name: lending_ledger_posting_requests uq_lending_ledger_posting_idempotency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lending_ledger_posting_requests
    ADD CONSTRAINT uq_lending_ledger_posting_idempotency UNIQUE (tenant_id, idempotency_key);


--
-- Name: lending_ledger_posting_requests uq_lending_ledger_posting_request_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lending_ledger_posting_requests
    ADD CONSTRAINT uq_lending_ledger_posting_request_reference UNIQUE (tenant_id, request_reference);


--
-- Name: loan_interest_accruals uq_loan_accrual_period; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_interest_accruals
    ADD CONSTRAINT uq_loan_accrual_period UNIQUE (loan_id, period_start, period_end);


--
-- Name: loan_applications uq_loan_application_idempotency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_applications
    ADD CONSTRAINT uq_loan_application_idempotency UNIQUE (tenant_id, idempotency_key);


--
-- Name: loans uq_loan_application_tenant; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT uq_loan_application_tenant UNIQUE (tenant_id, application_id);


--
-- Name: loan_applications uq_loan_application_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_applications
    ADD CONSTRAINT uq_loan_application_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_idempotency_keys uq_loan_idempotency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_idempotency_keys
    ADD CONSTRAINT uq_loan_idempotency UNIQUE (tenant_id, idempotency_key);


--
-- Name: loans uq_loan_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT uq_loan_number UNIQUE (tenant_id, loan_number);


--
-- Name: loan_outbox_events uq_loan_outbox_idempotency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_outbox_events
    ADD CONSTRAINT uq_loan_outbox_idempotency UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_products uq_loan_product_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_products
    ADD CONSTRAINT uq_loan_product_code UNIQUE (tenant_id, product_code);


--
-- Name: loan_product_fees uq_loan_product_fees_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_fees
    ADD CONSTRAINT uq_loan_product_fees_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_products uq_loan_product_idempotency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_products
    ADD CONSTRAINT uq_loan_product_idempotency UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_product_rules uq_loan_product_rules_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_rules
    ADD CONSTRAINT uq_loan_product_rules_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_product_tiers uq_loan_product_tiers_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_tiers
    ADD CONSTRAINT uq_loan_product_tiers_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_products uq_loan_products_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_products
    ADD CONSTRAINT uq_loan_products_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_schedules uq_loan_schedule_version; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_schedules
    ADD CONSTRAINT uq_loan_schedule_version UNIQUE (loan_id, schedule_version);


--
-- Name: loans uq_loans_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT uq_loans_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_direct_debit_mandates uq_mandate_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_direct_debit_mandates
    ADD CONSTRAINT uq_mandate_reference UNIQUE (tenant_id, mandate_reference);


--
-- Name: loan_offers uq_offer_idempotency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offers
    ADD CONSTRAINT uq_offer_idempotency UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_offers uq_offer_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offers
    ADD CONSTRAINT uq_offer_reference UNIQUE (tenant_id, offer_reference);


--
-- Name: loan_offers uq_offer_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offers
    ADD CONSTRAINT uq_offer_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_offers uq_offer_version; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offers
    ADD CONSTRAINT uq_offer_version UNIQUE (application_id, version_number);


--
-- Name: loan_payment_links uq_payment_link_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_payment_links
    ADD CONSTRAINT uq_payment_link_reference UNIQUE (tenant_id, link_reference);


--
-- Name: lending_ledger_posting_requests uq_postings_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lending_ledger_posting_requests
    ADD CONSTRAINT uq_postings_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_product_rules uq_product_rule; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_rules
    ADD CONSTRAINT uq_product_rule UNIQUE (loan_product_id, rule_code);


--
-- Name: loan_product_tiers uq_product_tier; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_tiers
    ADD CONSTRAINT uq_product_tier UNIQUE (loan_product_id, tier_code);


--
-- Name: loan_product_versions uq_product_version; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_versions
    ADD CONSTRAINT uq_product_version UNIQUE (loan_product_id, version_number);


--
-- Name: loan_product_versions uq_product_version_idempotency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_versions
    ADD CONSTRAINT uq_product_version_idempotency UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_product_versions uq_product_versions_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_versions
    ADD CONSTRAINT uq_product_versions_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_direct_debit_mandates uq_provider_mandate_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_direct_debit_mandates
    ADD CONSTRAINT uq_provider_mandate_reference UNIQUE (provider_code, provider_mandate_reference);


--
-- Name: loan_write_off_recoveries uq_recovery_event; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_off_recoveries
    ADD CONSTRAINT uq_recovery_event UNIQUE (tenant_id, source_event_id);


--
-- Name: loan_write_off_recoveries uq_recovery_idempotency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_off_recoveries
    ADD CONSTRAINT uq_recovery_idempotency UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_write_off_recoveries uq_recovery_payment; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_off_recoveries
    ADD CONSTRAINT uq_recovery_payment UNIQUE (tenant_id, payment_transaction_id);


--
-- Name: loan_write_off_recoveries uq_recovery_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_off_recoveries
    ADD CONSTRAINT uq_recovery_reference UNIQUE (tenant_id, recovery_reference);


--
-- Name: loan_write_off_recoveries uq_recovery_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_off_recoveries
    ADD CONSTRAINT uq_recovery_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_repayment_allocations uq_repayment_allocation_tenant; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocations
    ADD CONSTRAINT uq_repayment_allocation_tenant UNIQUE (tenant_id, id);


--
-- Name: loan_repayment_attempts uq_repayment_attempt; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_attempts
    ADD CONSTRAINT uq_repayment_attempt UNIQUE (loan_id, attempt_number);


--
-- Name: loan_repayment_attempts uq_repayment_attempt_tenant; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_attempts
    ADD CONSTRAINT uq_repayment_attempt_tenant UNIQUE (tenant_id, id);


--
-- Name: loan_repayments uq_repayment_idempotency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayments
    ADD CONSTRAINT uq_repayment_idempotency UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_repayments uq_repayment_payment; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayments
    ADD CONSTRAINT uq_repayment_payment UNIQUE (tenant_id, payment_transaction_id);


--
-- Name: loan_repayments uq_repayment_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayments
    ADD CONSTRAINT uq_repayment_reference UNIQUE (tenant_id, repayment_reference);


--
-- Name: loan_repayments uq_repayment_source_event; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayments
    ADD CONSTRAINT uq_repayment_source_event UNIQUE (tenant_id, source_event_id);


--
-- Name: loan_repayments uq_repayments_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayments
    ADD CONSTRAINT uq_repayments_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_restructures uq_restructure_idempotency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_restructures
    ADD CONSTRAINT uq_restructure_idempotency UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_restructures uq_restructure_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_restructures
    ADD CONSTRAINT uq_restructure_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_schedules uq_schedules_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_schedules
    ADD CONSTRAINT uq_schedules_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_write_offs uq_writeoff_idempotency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_offs
    ADD CONSTRAINT uq_writeoff_idempotency UNIQUE (tenant_id, idempotency_key);


--
-- Name: loan_write_offs uq_writeoff_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_offs
    ADD CONSTRAINT uq_writeoff_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_write_offs uq_writeoffs_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_offs
    ADD CONSTRAINT uq_writeoffs_tenant_id UNIQUE (tenant_id, id);


--
-- Name: idx_accrual_worker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accrual_worker ON public.loan_interest_accruals USING btree (status, available_at, lease_expires_at) WHERE ((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('POSTING'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text]));


--
-- Name: idx_application_customer_history; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_customer_history ON public.loan_applications USING btree (tenant_id, customer_id, created_at DESC);


--
-- Name: idx_application_decisions_application; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_decisions_application ON public.loan_application_decisions USING btree (application_id, decided_at DESC);


--
-- Name: idx_application_documents_application; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_documents_application ON public.loan_application_documents USING btree (application_id);


--
-- Name: idx_application_events_application; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_events_application ON public.loan_application_events USING btree (application_id, created_at DESC);


--
-- Name: idx_application_events_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_events_tenant ON public.loan_application_events USING btree (tenant_id, application_id, created_at DESC);


--
-- Name: idx_application_manual_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_manual_review ON public.loan_applications USING btree (tenant_id, updated_at) WHERE (status = 'UNDER_REVIEW'::public.loan_application_status_enum);


--
-- Name: idx_application_reviews_application; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_reviews_application ON public.loan_application_reviews USING btree (application_id, created_at DESC);


--
-- Name: idx_application_reviews_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_reviews_tenant ON public.loan_application_reviews USING btree (tenant_id, application_id, created_at DESC);


--
-- Name: idx_asset_disbursements_asset; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asset_disbursements_asset ON public.loan_asset_disbursements USING btree (asset_id);


--
-- Name: idx_asset_disbursements_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asset_disbursements_loan ON public.loan_asset_disbursements USING btree (loan_id);


--
-- Name: idx_asset_disbursements_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asset_disbursements_status ON public.loan_asset_disbursements USING btree (tenant_id, status);


--
-- Name: idx_delinquency_current; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_delinquency_current ON public.loan_delinquency_assessments USING btree (tenant_id, loan_id, assessment_date DESC);


--
-- Name: idx_direct_debit_mandates_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_direct_debit_mandates_customer ON public.loan_direct_debit_mandates USING btree (tenant_id, customer_id);


--
-- Name: idx_direct_debit_mandates_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_direct_debit_mandates_loan ON public.loan_direct_debit_mandates USING btree (loan_id);


--
-- Name: idx_direct_debit_mandates_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_direct_debit_mandates_status ON public.loan_direct_debit_mandates USING btree (tenant_id, status);


--
-- Name: idx_disbursement_recovery; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disbursement_recovery ON public.loan_disbursements USING btree (status, next_inquiry_at, lease_expires_at) WHERE ((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('COMPENSATING'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text]));


--
-- Name: idx_evaluation_claim; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evaluation_claim ON public.loan_automated_evaluations USING btree (status, lease_expires_at, created_at) WHERE ((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('PROCESSING'::character varying)::text]));


--
-- Name: idx_interest_accruals_loan_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interest_accruals_loan_date ON public.loan_interest_accruals USING btree (tenant_id, loan_id, accrual_date DESC);


--
-- Name: idx_interest_accruals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interest_accruals_status ON public.loan_interest_accruals USING btree (tenant_id, status);


--
-- Name: idx_lending_posting_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lending_posting_loan ON public.lending_ledger_posting_requests USING btree (tenant_id, loan_id, created_at DESC);


--
-- Name: idx_lending_posting_work; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lending_posting_work ON public.lending_ledger_posting_requests USING btree (status, available_at) WHERE (status = ANY (ARRAY['PENDING'::public.lending_ledger_posting_status_enum, 'FAILED'::public.lending_ledger_posting_status_enum]));


--
-- Name: idx_loan_adjustments_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_adjustments_loan ON public.loan_adjustments USING btree (loan_id);


--
-- Name: idx_loan_adjustments_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_adjustments_type ON public.loan_adjustments USING btree (tenant_id, adjustment_type);


--
-- Name: idx_loan_applications_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_applications_customer ON public.loan_applications USING btree (tenant_id, customer_id, created_at DESC);


--
-- Name: idx_loan_applications_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_applications_number ON public.loan_applications USING btree (application_number);


--
-- Name: idx_loan_applications_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_applications_product ON public.loan_applications USING btree (loan_product_id);


--
-- Name: idx_loan_applications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_applications_status ON public.loan_applications USING btree (tenant_id, status);


--
-- Name: idx_loan_assets_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_assets_loan ON public.loan_assets USING btree (loan_id);


--
-- Name: idx_loan_assets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_assets_status ON public.loan_assets USING btree (tenant_id, status);


--
-- Name: idx_loan_collaterals_identifier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_collaterals_identifier ON public.loan_collaterals USING btree (asset_identifier);


--
-- Name: idx_loan_collaterals_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_collaterals_loan ON public.loan_collaterals USING btree (loan_id);


--
-- Name: idx_loan_collaterals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_collaterals_status ON public.loan_collaterals USING btree (tenant_id, status);


--
-- Name: idx_loan_collections_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_collections_customer ON public.loan_collections USING btree (tenant_id, customer_id);


--
-- Name: idx_loan_collections_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_collections_loan ON public.loan_collections USING btree (tenant_id, loan_id, created_at DESC);


--
-- Name: idx_loan_collections_promised_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_collections_promised_date ON public.loan_collections USING btree (promised_date);


--
-- Name: idx_loan_disbursements_ledger; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_disbursements_ledger ON public.loan_disbursements USING btree (ledger_transaction_id);


--
-- Name: idx_loan_disbursements_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_disbursements_loan ON public.loan_disbursements USING btree (loan_id);


--
-- Name: idx_loan_disbursements_payment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_disbursements_payment ON public.loan_disbursements USING btree (payment_transaction_id);


--
-- Name: idx_loan_disbursements_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_disbursements_status ON public.loan_disbursements USING btree (tenant_id, status);


--
-- Name: idx_loan_idempotency_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_idempotency_expiry ON public.loan_idempotency_keys USING btree (expires_at);


--
-- Name: idx_loan_inbox_aggregate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_inbox_aggregate ON public.loan_inbox_events USING btree (aggregate_type, aggregate_id);


--
-- Name: idx_loan_inbox_work; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_inbox_work ON public.loan_inbox_events USING btree (status, available_at) WHERE (status = ANY (ARRAY['RECEIVED'::public.inbox_event_status_enum, 'FAILED'::public.inbox_event_status_enum]));


--
-- Name: idx_loan_installments_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_installments_due ON public.loan_installments USING btree (tenant_id, due_date, status);


--
-- Name: idx_loan_installments_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_installments_loan ON public.loan_installments USING btree (tenant_id, loan_id, due_date);


--
-- Name: idx_loan_offers_application; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_offers_application ON public.loan_offers USING btree (tenant_id, application_id, created_at DESC);


--
-- Name: idx_loan_outbox_aggregate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_outbox_aggregate ON public.loan_outbox_events USING btree (aggregate_type, aggregate_id);


--
-- Name: idx_loan_outbox_claim; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_outbox_claim ON public.loan_outbox_events USING btree (available_at, created_at) WHERE ((status)::text = ANY ((ARRAY['PENDING'::character varying, 'FAILED'::character varying])::text[]));


--
-- Name: idx_loan_outbox_expired_lease; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_outbox_expired_lease ON public.loan_outbox_events USING btree (lease_expires_at) WHERE ((status)::text = 'PROCESSING'::text);


--
-- Name: idx_loan_outbox_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_outbox_pending ON public.loan_outbox_events USING btree (available_at) WHERE ((status)::text = 'PENDING'::text);


--
-- Name: idx_loan_parties_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_parties_customer ON public.loan_parties USING btree (customer_id);


--
-- Name: idx_loan_parties_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_parties_loan ON public.loan_parties USING btree (loan_id);


--
-- Name: idx_loan_payment_links_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_payment_links_expiry ON public.loan_payment_links USING btree (expires_at);


--
-- Name: idx_loan_payment_links_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_payment_links_loan ON public.loan_payment_links USING btree (loan_id);


--
-- Name: idx_loan_product_fees_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_product_fees_product ON public.loan_product_fees USING btree (loan_product_id);


--
-- Name: idx_loan_product_rules_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_product_rules_product ON public.loan_product_rules USING btree (loan_product_id);


--
-- Name: idx_loan_product_tiers_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_product_tiers_product ON public.loan_product_tiers USING btree (loan_product_id);


--
-- Name: idx_loan_products_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_products_active ON public.loan_products USING btree (tenant_id, is_active);


--
-- Name: idx_loan_products_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_products_tenant ON public.loan_products USING btree (tenant_id);


--
-- Name: idx_loan_products_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_products_type ON public.loan_products USING btree (tenant_id, product_type);


--
-- Name: idx_loan_quote_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_quote_customer ON public.loan_quotes USING btree (tenant_id, customer_id, created_at DESC);


--
-- Name: idx_loan_repayments_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_repayments_customer ON public.loan_repayments USING btree (tenant_id, customer_id);


--
-- Name: idx_loan_repayments_ledger; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_repayments_ledger ON public.loan_repayments USING btree (ledger_transaction_id);


--
-- Name: idx_loan_repayments_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_repayments_loan ON public.loan_repayments USING btree (tenant_id, loan_id, created_at DESC);


--
-- Name: idx_loan_repayments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_repayments_status ON public.loan_repayments USING btree (tenant_id, status);


--
-- Name: idx_loan_restructures_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_restructures_loan ON public.loan_restructures USING btree (loan_id);


--
-- Name: idx_loan_restructures_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_restructures_status ON public.loan_restructures USING btree (tenant_id, status);


--
-- Name: idx_loan_schedules_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_schedules_loan ON public.loan_schedules USING btree (loan_id);


--
-- Name: idx_loan_status_history_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_status_history_loan ON public.loan_status_history USING btree (loan_id, created_at DESC);


--
-- Name: idx_loan_status_history_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_status_history_status ON public.loan_status_history USING btree (tenant_id, new_status);


--
-- Name: idx_loan_writeoffs_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_writeoffs_loan ON public.loan_write_offs USING btree (loan_id);


--
-- Name: idx_loan_writeoffs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loan_writeoffs_status ON public.loan_write_offs USING btree (tenant_id, status);


--
-- Name: idx_loans_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loans_customer ON public.loans USING btree (tenant_id, customer_id, created_at DESC);


--
-- Name: idx_loans_maturity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loans_maturity ON public.loans USING btree (tenant_id, maturity_date);


--
-- Name: idx_loans_next_payment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loans_next_payment ON public.loans USING btree (tenant_id, next_payment_date);


--
-- Name: idx_loans_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loans_number ON public.loans USING btree (loan_number);


--
-- Name: idx_loans_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loans_product ON public.loans USING btree (loan_product_id);


--
-- Name: idx_loans_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loans_status ON public.loans USING btree (tenant_id, status);


--
-- Name: idx_manual_assignment_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manual_assignment_case ON public.loan_manual_review_assignments USING btree (tenant_id, review_case_id, assigned_at DESC);


--
-- Name: idx_manual_recommendation_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manual_recommendation_case ON public.loan_manual_review_recommendations USING btree (tenant_id, review_case_id, created_at DESC);


--
-- Name: idx_manual_review_queue; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manual_review_queue ON public.loan_manual_review_cases USING btree (tenant_id, status, lease_expires_at, opened_at);


--
-- Name: idx_penalty_worker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_penalty_worker ON public.loan_penalty_assessments USING btree (status, assessment_date) WHERE ((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('POSTING'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text]));


--
-- Name: idx_post_writeoff_recovery; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_writeoff_recovery ON public.loan_write_off_recoveries USING btree (status, created_at) WHERE ((status)::text = ANY (ARRAY[('PROCESSING'::character varying)::text, ('LEDGER_POSTING'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text]));


--
-- Name: idx_product_versions_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_versions_tenant ON public.loan_product_versions USING btree (tenant_id, loan_product_id);


--
-- Name: idx_repayment_allocations_installment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repayment_allocations_installment ON public.loan_repayment_allocations USING btree (installment_id);


--
-- Name: idx_repayment_allocations_repayment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repayment_allocations_repayment ON public.loan_repayment_allocations USING btree (repayment_id);


--
-- Name: idx_repayment_attempts_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repayment_attempts_loan ON public.loan_repayment_attempts USING btree (loan_id);


--
-- Name: idx_repayment_attempts_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repayment_attempts_provider ON public.loan_repayment_attempts USING btree (provider_reference);


--
-- Name: idx_repayment_attempts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repayment_attempts_status ON public.loan_repayment_attempts USING btree (tenant_id, status);


--
-- Name: idx_repayment_lines_batch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repayment_lines_batch ON public.loan_repayment_allocation_lines USING btree (tenant_id, batch_id, sequence_number);


--
-- Name: idx_repayment_quote_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repayment_quote_customer ON public.loan_repayment_quotes USING btree (tenant_id, customer_id, created_at DESC);


--
-- Name: idx_repayment_recovery; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repayment_recovery ON public.loan_repayments USING btree (status, created_at) WHERE ((status)::text = ANY (ARRAY[('PROCESSING'::character varying)::text, ('LEDGER_POSTING'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text]));


--
-- Name: idx_repayment_request_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repayment_request_status ON public.loan_repayment_requests USING btree (status, updated_at) WHERE ((status)::text = ANY (ARRAY[('SUBMITTING'::character varying)::text, ('PENDING_COLLECTION'::character varying)::text, ('PENDING_MATCH'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text]));


--
-- Name: idx_restructure_recovery; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_restructure_recovery ON public.loan_restructures USING btree (status, requested_at) WHERE ((status)::text = ANY (ARRAY[('APPROVAL_PENDING'::character varying)::text, ('LEDGER_POSTING'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text]));


--
-- Name: idx_servicing_run_worker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servicing_run_worker ON public.loan_servicing_runs USING btree (status, run_date, lease_expires_at) WHERE ((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('RUNNING'::character varying)::text]));


--
-- Name: idx_status_history_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_status_history_tenant ON public.loan_status_history USING btree (tenant_id, loan_id, created_at DESC);


--
-- Name: idx_unapplied_credit_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unapplied_credit_customer ON public.loan_unapplied_credits USING btree (tenant_id, loan_id, status);


--
-- Name: idx_writeoff_recoveries_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_writeoff_recoveries_loan ON public.loan_write_off_recoveries USING btree (tenant_id, loan_id, created_at DESC);


--
-- Name: idx_writeoff_recoveries_writeoff; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_writeoff_recoveries_writeoff ON public.loan_write_off_recoveries USING btree (write_off_id);


--
-- Name: idx_writeoff_recovery; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_writeoff_recovery ON public.loan_write_offs USING btree (status, requested_at) WHERE ((status)::text = ANY (ARRAY[('APPROVAL_PENDING'::character varying)::text, ('LEDGER_POSTING'::character varying)::text, ('MANUAL_REVIEW'::character varying)::text]));


--
-- Name: uq_accepted_offer_per_application; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_accepted_offer_per_application ON public.loan_offers USING btree (application_id) WHERE (status = 'ACCEPTED'::public.loan_offer_status_enum);


--
-- Name: uq_active_contract_per_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_active_contract_per_loan ON public.loan_contracts USING btree (loan_id) WHERE (status = 'ACTIVE'::public.loan_contract_status_enum);


--
-- Name: uq_active_manual_review; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_active_manual_review ON public.loan_manual_review_cases USING btree (tenant_id, application_id) WHERE ((status)::text = ANY (ARRAY[('OPEN'::character varying)::text, ('ASSIGNED'::character varying)::text, ('PENDING_APPROVAL'::character varying)::text]));


--
-- Name: uq_active_restructure; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_active_restructure ON public.loan_restructures USING btree (tenant_id, loan_id) WHERE ((status)::text = ANY (ARRAY[('REQUESTED'::character varying)::text, ('APPROVAL_PENDING'::character varying)::text, ('APPROVED'::character varying)::text, ('LEDGER_POSTING'::character varying)::text]));


--
-- Name: uq_active_schedule_per_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_active_schedule_per_loan ON public.loan_schedules USING btree (loan_id) WHERE is_active;


--
-- Name: uq_completed_writeoff_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_completed_writeoff_loan ON public.loan_write_offs USING btree (tenant_id, loan_id) WHERE ((status)::text = 'COMPLETED'::text);


--
-- Name: uq_current_issued_offer; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_current_issued_offer ON public.loan_offers USING btree (tenant_id, application_id) WHERE (status = 'ISSUED'::public.loan_offer_status_enum);


--
-- Name: uq_current_product_version; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_current_product_version ON public.loan_product_versions USING btree (loan_product_id) WHERE is_current;


--
-- Name: uq_current_published_product_version; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_current_published_product_version ON public.loan_product_versions USING btree (tenant_id, loan_product_id) WHERE (((status)::text = 'PUBLISHED'::text) AND is_current);


--
-- Name: uq_disbursement_ledger_tx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_disbursement_ledger_tx ON public.loan_disbursements USING btree (ledger_transaction_id) WHERE (ledger_transaction_id IS NOT NULL);


--
-- Name: uq_disbursement_payment_tx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_disbursement_payment_tx ON public.loan_disbursements USING btree (payment_transaction_id) WHERE (payment_transaction_id IS NOT NULL);


--
-- Name: uq_final_automated_decision; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_final_automated_decision ON public.loan_application_decisions USING btree (tenant_id, evaluation_id) WHERE ((decision_source)::text = 'AUTOMATED'::text);


--
-- Name: uq_lending_posting_ledger_tx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_lending_posting_ledger_tx ON public.lending_ledger_posting_requests USING btree (ledger_transaction_id) WHERE (ledger_transaction_id IS NOT NULL);


--
-- Name: uq_manual_case_opening_idempotency; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_manual_case_opening_idempotency ON public.loan_manual_review_cases USING btree (tenant_id, opening_idempotency_key) WHERE (opening_idempotency_key IS NOT NULL);


--
-- Name: uq_manual_decision_application; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_manual_decision_application ON public.loan_application_decisions USING btree (tenant_id, application_id) WHERE ((decision_source)::text = 'MANUAL'::text);


--
-- Name: uq_manual_decision_idempotency; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_manual_decision_idempotency ON public.loan_application_decisions USING btree (tenant_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);


--
-- Name: uq_successful_disbursement_per_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_successful_disbursement_per_loan ON public.loan_disbursements USING btree (tenant_id, loan_id) WHERE ((status)::text = 'SUCCEEDED'::text);


--
-- Name: lending_ledger_posting_requests trg_lending_posting_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lending_posting_updated_at BEFORE UPDATE ON public.lending_ledger_posting_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_application_documents trg_loan_application_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loan_application_documents_updated_at BEFORE UPDATE ON public.loan_application_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_applications trg_loan_applications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loan_applications_updated_at BEFORE UPDATE ON public.loan_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_asset_disbursements trg_loan_asset_disbursements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loan_asset_disbursements_updated_at BEFORE UPDATE ON public.loan_asset_disbursements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_assets trg_loan_assets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loan_assets_updated_at BEFORE UPDATE ON public.loan_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_collaterals trg_loan_collaterals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loan_collaterals_updated_at BEFORE UPDATE ON public.loan_collaterals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_contracts trg_loan_contracts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loan_contracts_updated_at BEFORE UPDATE ON public.loan_contracts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_direct_debit_mandates trg_loan_direct_debit_mandates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loan_direct_debit_mandates_updated_at BEFORE UPDATE ON public.loan_direct_debit_mandates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_inbox_events trg_loan_inbox_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loan_inbox_updated_at BEFORE UPDATE ON public.loan_inbox_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_installments trg_loan_installments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loan_installments_updated_at BEFORE UPDATE ON public.loan_installments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_offers trg_loan_offers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loan_offers_updated_at BEFORE UPDATE ON public.loan_offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_product_fees trg_loan_product_fees_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loan_product_fees_updated_at BEFORE UPDATE ON public.loan_product_fees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_product_rules trg_loan_product_rules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loan_product_rules_updated_at BEFORE UPDATE ON public.loan_product_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_product_tiers trg_loan_product_tiers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loan_product_tiers_updated_at BEFORE UPDATE ON public.loan_product_tiers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_products trg_loan_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loan_products_updated_at BEFORE UPDATE ON public.loan_products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_repayments trg_loan_repayments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loan_repayments_updated_at BEFORE UPDATE ON public.loan_repayments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loans trg_loans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_application_events trg_protect_application_events; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_application_events BEFORE DELETE OR UPDATE ON public.loan_application_events FOR EACH ROW EXECUTE FUNCTION public.protect_application_events();


--
-- Name: loan_automated_evaluations trg_protect_completed_evaluation; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_completed_evaluation BEFORE DELETE OR UPDATE ON public.loan_automated_evaluations FOR EACH ROW EXECUTE FUNCTION public.protect_completed_evaluation();


--
-- Name: loan_write_offs trg_protect_completed_writeoff; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_completed_writeoff BEFORE DELETE OR UPDATE ON public.loan_write_offs FOR EACH ROW EXECUTE FUNCTION public.protect_completed_writeoff();


--
-- Name: loan_manual_review_cases trg_protect_decided_manual_case; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_decided_manual_case BEFORE DELETE OR UPDATE ON public.loan_manual_review_cases FOR EACH ROW EXECUTE FUNCTION public.protect_decided_manual_case();


--
-- Name: loan_application_decisions trg_protect_decision; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_decision BEFORE DELETE OR UPDATE ON public.loan_application_decisions FOR EACH ROW EXECUTE FUNCTION public.protect_underwriting_evidence();


--
-- Name: loan_delinquency_assessments trg_protect_delinquency_assessment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_delinquency_assessment BEFORE DELETE OR UPDATE ON public.loan_delinquency_assessments FOR EACH ROW EXECUTE FUNCTION public.protect_delinquency_assessment();


--
-- Name: loan_disbursement_saga_steps trg_protect_disbursement_step; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_disbursement_step BEFORE DELETE OR UPDATE ON public.loan_disbursement_saga_steps FOR EACH ROW EXECUTE FUNCTION public.protect_disbursement_step();


--
-- Name: loan_interest_accruals trg_protect_final_interest_accrual; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_final_interest_accrual BEFORE DELETE OR UPDATE ON public.loan_interest_accruals FOR EACH ROW EXECUTE FUNCTION public.protect_final_servicing_evidence();


--
-- Name: loan_penalty_assessments trg_protect_final_penalty; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_final_penalty BEFORE DELETE OR UPDATE ON public.loan_penalty_assessments FOR EACH ROW EXECUTE FUNCTION public.protect_final_servicing_evidence();


--
-- Name: loan_repayments trg_protect_final_repayment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_final_repayment BEFORE DELETE OR UPDATE ON public.loan_repayments FOR EACH ROW EXECUTE FUNCTION public.protect_final_repayment_evidence();


--
-- Name: loan_repayment_allocation_batches trg_protect_final_repayment_batch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_final_repayment_batch BEFORE DELETE OR UPDATE ON public.loan_repayment_allocation_batches FOR EACH ROW EXECUTE FUNCTION public.protect_final_repayment_batch();


--
-- Name: loan_repayment_reversals trg_protect_final_repayment_reversal; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_final_repayment_reversal BEFORE DELETE OR UPDATE ON public.loan_repayment_reversals FOR EACH ROW EXECUTE FUNCTION public.protect_final_repayment_reversal();


--
-- Name: loan_offers trg_protect_issued_offer; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_issued_offer BEFORE DELETE OR UPDATE ON public.loan_offers FOR EACH ROW EXECUTE FUNCTION public.protect_issued_offer();


--
-- Name: loan_repayment_allocations trg_protect_legacy_repayment_allocations; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_legacy_repayment_allocations BEFORE DELETE OR UPDATE ON public.loan_repayment_allocations FOR EACH ROW EXECUTE FUNCTION public.protect_repayment_allocation_evidence();


--
-- Name: loan_quotes trg_protect_loan_quote; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_loan_quote BEFORE DELETE OR UPDATE ON public.loan_quotes FOR EACH ROW EXECUTE FUNCTION public.protect_customer_quote_evidence();


--
-- Name: loan_manual_review_assignments trg_protect_manual_assignment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_manual_assignment BEFORE DELETE OR UPDATE ON public.loan_manual_review_assignments FOR EACH ROW EXECUTE FUNCTION public.protect_manual_underwriting_evidence();


--
-- Name: loan_manual_review_recommendations trg_protect_manual_recommendation; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_manual_recommendation BEFORE DELETE OR UPDATE ON public.loan_manual_review_recommendations FOR EACH ROW EXECUTE FUNCTION public.protect_manual_underwriting_evidence();


--
-- Name: loan_offer_acceptances trg_protect_offer_acceptance; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_offer_acceptance BEFORE DELETE OR UPDATE ON public.loan_offer_acceptances FOR EACH ROW EXECUTE FUNCTION public.protect_offer_calculation();


--
-- Name: loan_offer_fee_lines trg_protect_offer_fee; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_offer_fee BEFORE DELETE OR UPDATE ON public.loan_offer_fee_lines FOR EACH ROW EXECUTE FUNCTION public.protect_offer_calculation();


--
-- Name: loan_offer_installments trg_protect_offer_installment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_offer_installment BEFORE DELETE OR UPDATE ON public.loan_offer_installments FOR EACH ROW EXECUTE FUNCTION public.protect_offer_calculation();


--
-- Name: loan_offer_schedules trg_protect_offer_schedule; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_offer_schedule BEFORE DELETE OR UPDATE ON public.loan_offer_schedules FOR EACH ROW EXECUTE FUNCTION public.protect_offer_calculation();


--
-- Name: loan_write_off_recoveries trg_protect_posted_recovery; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_posted_recovery BEFORE DELETE OR UPDATE ON public.loan_write_off_recoveries FOR EACH ROW EXECUTE FUNCTION public.protect_posted_recovery();


--
-- Name: loan_product_version_history trg_protect_product_version_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_product_version_history BEFORE DELETE OR UPDATE ON public.loan_product_version_history FOR EACH ROW EXECUTE FUNCTION public.protect_product_version_history();


--
-- Name: loan_product_versions trg_protect_published_product_version; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_published_product_version BEFORE DELETE OR UPDATE ON public.loan_product_versions FOR EACH ROW EXECUTE FUNCTION public.protect_published_product_version();


--
-- Name: loan_repayment_lifecycle_history trg_protect_repayment_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_repayment_history BEFORE DELETE OR UPDATE ON public.loan_repayment_lifecycle_history FOR EACH ROW EXECUTE FUNCTION public.protect_repayment_allocation_evidence();


--
-- Name: loan_repayment_allocation_lines trg_protect_repayment_lines; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_repayment_lines BEFORE DELETE OR UPDATE ON public.loan_repayment_allocation_lines FOR EACH ROW EXECUTE FUNCTION public.protect_repayment_allocation_evidence();


--
-- Name: loan_repayment_quotes trg_protect_repayment_quote; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_repayment_quote BEFORE DELETE OR UPDATE ON public.loan_repayment_quotes FOR EACH ROW EXECUTE FUNCTION public.protect_customer_quote_evidence();


--
-- Name: loan_repayment_requests trg_protect_repayment_request; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_repayment_request BEFORE DELETE OR UPDATE ON public.loan_repayment_requests FOR EACH ROW EXECUTE FUNCTION public.protect_repayment_request_evidence();


--
-- Name: loan_restructure_history trg_protect_restructure_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_restructure_history BEFORE DELETE OR UPDATE ON public.loan_restructure_history FOR EACH ROW EXECUTE FUNCTION public.protect_ln08_history();


--
-- Name: loan_automated_rule_results trg_protect_rule_result; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_rule_result BEFORE DELETE OR UPDATE ON public.loan_automated_rule_results FOR EACH ROW EXECUTE FUNCTION public.protect_underwriting_evidence();


--
-- Name: loan_contracts trg_protect_signed_contract; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_signed_contract BEFORE DELETE OR UPDATE ON public.loan_contracts FOR EACH ROW EXECUTE FUNCTION public.protect_signed_contract();


--
-- Name: loan_writeoff_history trg_protect_writeoff_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_writeoff_history BEFORE DELETE OR UPDATE ON public.loan_writeoff_history FOR EACH ROW EXECUTE FUNCTION public.protect_ln08_history();


--
-- Name: loan_applications trg_record_application_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_record_application_status AFTER INSERT OR UPDATE OF status ON public.loan_applications FOR EACH ROW EXECUTE FUNCTION public.record_application_status();


--
-- Name: loan_product_versions trg_record_product_version_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_record_product_version_status AFTER INSERT OR UPDATE OF status ON public.loan_product_versions FOR EACH ROW EXECUTE FUNCTION public.record_product_version_status();


--
-- Name: loan_applications trg_validate_application_transition; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_application_transition BEFORE UPDATE ON public.loan_applications FOR EACH ROW EXECUTE FUNCTION public.validate_application_transition();


--
-- Name: loan_installments trg_validate_installment_balances; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_installment_balances BEFORE UPDATE OF principal_paid, interest_paid, fees_paid, penalty_paid, total_paid ON public.loan_installments FOR EACH ROW EXECUTE FUNCTION public.validate_installment_balances();


--
-- Name: loan_application_decisions trg_validate_manual_decision_separation; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_manual_decision_separation BEFORE INSERT ON public.loan_application_decisions FOR EACH ROW EXECUTE FUNCTION public.validate_manual_decision_separation();


--
-- Name: loan_repayment_requests trg_validate_repayment_request_transition; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_repayment_request_transition BEFORE UPDATE ON public.loan_repayment_requests FOR EACH ROW EXECUTE FUNCTION public.validate_repayment_request_transition();


--
-- Name: loan_write_off_recoveries trg_writeoff_recoveries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_writeoff_recoveries_updated_at BEFORE UPDATE ON public.loan_write_off_recoveries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: loan_interest_accruals fk_accrual_loan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_interest_accruals
    ADD CONSTRAINT fk_accrual_loan FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_interest_accruals fk_accrual_posting; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_interest_accruals
    ADD CONSTRAINT fk_accrual_posting FOREIGN KEY (ledger_posting_request_id) REFERENCES public.lending_ledger_posting_requests(id);


--
-- Name: loan_interest_accruals fk_accrual_reversal; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_interest_accruals
    ADD CONSTRAINT fk_accrual_reversal FOREIGN KEY (reversal_of_id) REFERENCES public.loan_interest_accruals(id);


--
-- Name: loan_repayment_allocations fk_allocation_installment_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocations
    ADD CONSTRAINT fk_allocation_installment_tenant FOREIGN KEY (tenant_id, installment_id) REFERENCES public.loan_installments(tenant_id, id);


--
-- Name: loan_repayment_allocations fk_allocation_repayment_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocations
    ADD CONSTRAINT fk_allocation_repayment_tenant FOREIGN KEY (tenant_id, repayment_id) REFERENCES public.loan_repayments(tenant_id, id);


--
-- Name: loan_application_decisions fk_application_decision; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_application_decisions
    ADD CONSTRAINT fk_application_decision FOREIGN KEY (application_id) REFERENCES public.loan_applications(id);


--
-- Name: loan_application_decisions fk_application_decision_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_application_decisions
    ADD CONSTRAINT fk_application_decision_tenant FOREIGN KEY (tenant_id, application_id) REFERENCES public.loan_applications(tenant_id, id);


--
-- Name: loan_application_documents fk_application_document; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_application_documents
    ADD CONSTRAINT fk_application_document FOREIGN KEY (application_id) REFERENCES public.loan_applications(id) ON DELETE CASCADE;


--
-- Name: loan_application_events fk_application_event; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_application_events
    ADD CONSTRAINT fk_application_event FOREIGN KEY (application_id) REFERENCES public.loan_applications(id);


--
-- Name: loan_applications fk_application_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_applications
    ADD CONSTRAINT fk_application_product FOREIGN KEY (loan_product_id) REFERENCES public.loan_products(id);


--
-- Name: loan_applications fk_application_product_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_applications
    ADD CONSTRAINT fk_application_product_tenant FOREIGN KEY (tenant_id, loan_product_id) REFERENCES public.loan_products(tenant_id, id);


--
-- Name: loan_applications fk_application_product_version; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_applications
    ADD CONSTRAINT fk_application_product_version FOREIGN KEY (loan_product_version_id) REFERENCES public.loan_product_versions(id);


--
-- Name: loan_application_reviews fk_application_review; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_application_reviews
    ADD CONSTRAINT fk_application_review FOREIGN KEY (application_id) REFERENCES public.loan_applications(id);


--
-- Name: loan_applications fk_application_version_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_applications
    ADD CONSTRAINT fk_application_version_tenant FOREIGN KEY (tenant_id, loan_product_version_id) REFERENCES public.loan_product_versions(tenant_id, id);


--
-- Name: loan_asset_disbursements fk_asset_disbursement_asset; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_asset_disbursements
    ADD CONSTRAINT fk_asset_disbursement_asset FOREIGN KEY (asset_id) REFERENCES public.loan_assets(id);


--
-- Name: loan_asset_disbursements fk_asset_disbursement_loan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_asset_disbursements
    ADD CONSTRAINT fk_asset_disbursement_loan FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_contracts fk_contract_acceptance_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_contracts
    ADD CONSTRAINT fk_contract_acceptance_tenant FOREIGN KEY (tenant_id, acceptance_id) REFERENCES public.loan_offer_acceptances(tenant_id, id);


--
-- Name: loan_contracts fk_contract_loan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_contracts
    ADD CONSTRAINT fk_contract_loan FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_contracts fk_contract_loan_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_contracts
    ADD CONSTRAINT fk_contract_loan_tenant FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_contracts fk_contract_offer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_contracts
    ADD CONSTRAINT fk_contract_offer FOREIGN KEY (offer_id) REFERENCES public.loan_offers(id);


--
-- Name: loan_contracts fk_contract_offer_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_contracts
    ADD CONSTRAINT fk_contract_offer_tenant FOREIGN KEY (tenant_id, offer_id) REFERENCES public.loan_offers(tenant_id, id);


--
-- Name: loan_application_decisions fk_decision_evaluation_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_application_decisions
    ADD CONSTRAINT fk_decision_evaluation_tenant FOREIGN KEY (tenant_id, evaluation_id) REFERENCES public.loan_automated_evaluations(tenant_id, id);


--
-- Name: loan_disbursements fk_disbursement_loan_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_disbursements
    ADD CONSTRAINT fk_disbursement_loan_tenant FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_product_fees fk_fee_product_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_fees
    ADD CONSTRAINT fk_fee_product_tenant FOREIGN KEY (tenant_id, loan_product_id) REFERENCES public.loan_products(tenant_id, id);


--
-- Name: loan_installments fk_installment_loan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_installments
    ADD CONSTRAINT fk_installment_loan FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_installments fk_installment_loan_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_installments
    ADD CONSTRAINT fk_installment_loan_tenant FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_installments fk_installment_schedule; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_installments
    ADD CONSTRAINT fk_installment_schedule FOREIGN KEY (schedule_id) REFERENCES public.loan_schedules(id) ON DELETE CASCADE;


--
-- Name: loan_installments fk_installment_schedule_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_installments
    ADD CONSTRAINT fk_installment_schedule_tenant FOREIGN KEY (tenant_id, schedule_id) REFERENCES public.loan_schedules(tenant_id, id);


--
-- Name: loan_interest_accruals fk_interest_accrual_installment_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_interest_accruals
    ADD CONSTRAINT fk_interest_accrual_installment_tenant FOREIGN KEY (tenant_id, installment_id) REFERENCES public.loan_installments(tenant_id, id);


--
-- Name: loan_interest_accruals fk_interest_accrual_loan_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_interest_accruals
    ADD CONSTRAINT fk_interest_accrual_loan_tenant FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_interest_accruals fk_interest_accrual_version_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_interest_accruals
    ADD CONSTRAINT fk_interest_accrual_version_tenant FOREIGN KEY (tenant_id, product_version_id) REFERENCES public.loan_product_versions(tenant_id, id);


--
-- Name: lending_ledger_posting_requests fk_lending_posting_loan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lending_ledger_posting_requests
    ADD CONSTRAINT fk_lending_posting_loan FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loans fk_loan_accepted_offer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT fk_loan_accepted_offer FOREIGN KEY (accepted_offer_id) REFERENCES public.loan_offers(id);


--
-- Name: loan_adjustments fk_loan_adjustment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_adjustments
    ADD CONSTRAINT fk_loan_adjustment FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loans fk_loan_application; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT fk_loan_application FOREIGN KEY (application_id) REFERENCES public.loan_applications(id);


--
-- Name: loans fk_loan_application_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT fk_loan_application_tenant FOREIGN KEY (tenant_id, application_id) REFERENCES public.loan_applications(tenant_id, id);


--
-- Name: loan_assets fk_loan_asset; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_assets
    ADD CONSTRAINT fk_loan_asset FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_collaterals fk_loan_collateral; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_collaterals
    ADD CONSTRAINT fk_loan_collateral FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_disbursements fk_loan_disbursement; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_disbursements
    ADD CONSTRAINT fk_loan_disbursement FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loans fk_loan_offer_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT fk_loan_offer_tenant FOREIGN KEY (tenant_id, accepted_offer_id) REFERENCES public.loan_offers(tenant_id, id);


--
-- Name: loan_parties fk_loan_party; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_parties
    ADD CONSTRAINT fk_loan_party FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE;


--
-- Name: loans fk_loan_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT fk_loan_product FOREIGN KEY (loan_product_id) REFERENCES public.loan_products(id);


--
-- Name: loans fk_loan_product_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT fk_loan_product_tenant FOREIGN KEY (tenant_id, loan_product_id) REFERENCES public.loan_products(tenant_id, id);


--
-- Name: loans fk_loan_product_version; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT fk_loan_product_version FOREIGN KEY (loan_product_version_id) REFERENCES public.loan_product_versions(id);


--
-- Name: loan_repayments fk_loan_repayment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayments
    ADD CONSTRAINT fk_loan_repayment FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_schedules fk_loan_schedule; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_schedules
    ADD CONSTRAINT fk_loan_schedule FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loans fk_loan_version_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT fk_loan_version_tenant FOREIGN KEY (tenant_id, loan_product_version_id) REFERENCES public.loan_product_versions(tenant_id, id);


--
-- Name: loan_write_offs fk_loan_writeoff; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_offs
    ADD CONSTRAINT fk_loan_writeoff FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_direct_debit_mandates fk_mandate_loan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_direct_debit_mandates
    ADD CONSTRAINT fk_mandate_loan FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_application_decisions fk_manual_decision_case; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_application_decisions
    ADD CONSTRAINT fk_manual_decision_case FOREIGN KEY (tenant_id, review_case_id) REFERENCES public.loan_manual_review_cases(tenant_id, id);


--
-- Name: loan_application_decisions fk_manual_decision_recommendation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_application_decisions
    ADD CONSTRAINT fk_manual_decision_recommendation FOREIGN KEY (tenant_id, recommendation_id) REFERENCES public.loan_manual_review_recommendations(tenant_id, id);


--
-- Name: loan_offers fk_offer_application; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offers
    ADD CONSTRAINT fk_offer_application FOREIGN KEY (application_id) REFERENCES public.loan_applications(id);


--
-- Name: loan_offers fk_offer_application_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offers
    ADD CONSTRAINT fk_offer_application_tenant FOREIGN KEY (tenant_id, application_id) REFERENCES public.loan_applications(tenant_id, id);


--
-- Name: loan_offers fk_offer_decision; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offers
    ADD CONSTRAINT fk_offer_decision FOREIGN KEY (decision_id) REFERENCES public.loan_application_decisions(id);


--
-- Name: loan_offers fk_offer_decision_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offers
    ADD CONSTRAINT fk_offer_decision_tenant FOREIGN KEY (tenant_id, decision_id) REFERENCES public.loan_application_decisions(tenant_id, id);


--
-- Name: loan_offers fk_offer_product_version; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offers
    ADD CONSTRAINT fk_offer_product_version FOREIGN KEY (loan_product_version_id) REFERENCES public.loan_product_versions(id);


--
-- Name: loan_offers fk_offer_version_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offers
    ADD CONSTRAINT fk_offer_version_tenant FOREIGN KEY (tenant_id, loan_product_version_id) REFERENCES public.loan_product_versions(tenant_id, id);


--
-- Name: loan_payment_links fk_payment_link_loan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_payment_links
    ADD CONSTRAINT fk_payment_link_loan FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_payment_links fk_payment_link_repayment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_payment_links
    ADD CONSTRAINT fk_payment_link_repayment FOREIGN KEY (repayment_id) REFERENCES public.loan_repayments(id);


--
-- Name: loan_product_fees fk_product_fee_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_fees
    ADD CONSTRAINT fk_product_fee_product FOREIGN KEY (loan_product_id) REFERENCES public.loan_products(id) ON DELETE CASCADE;


--
-- Name: loan_product_fees fk_product_fee_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_fees
    ADD CONSTRAINT fk_product_fee_tenant FOREIGN KEY (tenant_id, loan_product_id) REFERENCES public.loan_products(tenant_id, id);


--
-- Name: loan_product_rules fk_product_rule_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_rules
    ADD CONSTRAINT fk_product_rule_product FOREIGN KEY (loan_product_id) REFERENCES public.loan_products(id) ON DELETE CASCADE;


--
-- Name: loan_product_rules fk_product_rule_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_rules
    ADD CONSTRAINT fk_product_rule_tenant FOREIGN KEY (tenant_id, loan_product_id) REFERENCES public.loan_products(tenant_id, id);


--
-- Name: loan_product_tiers fk_product_tier_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_tiers
    ADD CONSTRAINT fk_product_tier_product FOREIGN KEY (loan_product_id) REFERENCES public.loan_products(id) ON DELETE CASCADE;


--
-- Name: loan_product_tiers fk_product_tier_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_tiers
    ADD CONSTRAINT fk_product_tier_tenant FOREIGN KEY (tenant_id, loan_product_id) REFERENCES public.loan_products(tenant_id, id);


--
-- Name: loan_product_versions fk_product_version_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_versions
    ADD CONSTRAINT fk_product_version_product FOREIGN KEY (loan_product_id) REFERENCES public.loan_products(id);


--
-- Name: loan_product_versions fk_product_version_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_versions
    ADD CONSTRAINT fk_product_version_tenant FOREIGN KEY (tenant_id, loan_product_id) REFERENCES public.loan_products(tenant_id, id);


--
-- Name: loan_write_off_recoveries fk_recovery_loan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_off_recoveries
    ADD CONSTRAINT fk_recovery_loan FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_write_off_recoveries fk_recovery_loan_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_off_recoveries
    ADD CONSTRAINT fk_recovery_loan_tenant FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_write_off_recoveries fk_recovery_posting; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_off_recoveries
    ADD CONSTRAINT fk_recovery_posting FOREIGN KEY (ledger_posting_request_id) REFERENCES public.lending_ledger_posting_requests(id);


--
-- Name: loan_write_off_recoveries fk_recovery_repayment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_off_recoveries
    ADD CONSTRAINT fk_recovery_repayment FOREIGN KEY (repayment_id) REFERENCES public.loan_repayments(id);


--
-- Name: loan_write_off_recoveries fk_recovery_reversal; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_off_recoveries
    ADD CONSTRAINT fk_recovery_reversal FOREIGN KEY (reversal_of_id) REFERENCES public.loan_write_off_recoveries(id);


--
-- Name: loan_write_off_recoveries fk_recovery_writeoff; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_off_recoveries
    ADD CONSTRAINT fk_recovery_writeoff FOREIGN KEY (write_off_id) REFERENCES public.loan_write_offs(id);


--
-- Name: loan_write_off_recoveries fk_recovery_writeoff_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_off_recoveries
    ADD CONSTRAINT fk_recovery_writeoff_tenant FOREIGN KEY (tenant_id, write_off_id) REFERENCES public.loan_write_offs(tenant_id, id);


--
-- Name: loan_write_off_recoveries fk_recovery_writeoff_tenant_v2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_off_recoveries
    ADD CONSTRAINT fk_recovery_writeoff_tenant_v2 FOREIGN KEY (tenant_id, write_off_id) REFERENCES public.loan_write_offs(tenant_id, id);


--
-- Name: loan_repayment_allocations fk_repayment_allocation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocations
    ADD CONSTRAINT fk_repayment_allocation FOREIGN KEY (repayment_id) REFERENCES public.loan_repayments(id) ON DELETE CASCADE;


--
-- Name: loan_repayment_attempts fk_repayment_attempt_loan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_attempts
    ADD CONSTRAINT fk_repayment_attempt_loan FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_repayment_attempts fk_repayment_attempt_loan_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_attempts
    ADD CONSTRAINT fk_repayment_attempt_loan_tenant FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_repayment_attempts fk_repayment_attempt_repayment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_attempts
    ADD CONSTRAINT fk_repayment_attempt_repayment FOREIGN KEY (repayment_id) REFERENCES public.loan_repayments(id);


--
-- Name: loan_repayment_attempts fk_repayment_attempt_repayment_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_attempts
    ADD CONSTRAINT fk_repayment_attempt_repayment_tenant FOREIGN KEY (tenant_id, repayment_id) REFERENCES public.loan_repayments(tenant_id, id);


--
-- Name: loan_repayment_allocations fk_repayment_installment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocations
    ADD CONSTRAINT fk_repayment_installment FOREIGN KEY (installment_id) REFERENCES public.loan_installments(id);


--
-- Name: loan_repayments fk_repayment_loan_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayments
    ADD CONSTRAINT fk_repayment_loan_tenant FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_restructures fk_restructure_loan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_restructures
    ADD CONSTRAINT fk_restructure_loan FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_restructures fk_restructure_loan_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_restructures
    ADD CONSTRAINT fk_restructure_loan_tenant FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_restructures fk_restructure_new_schedule; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_restructures
    ADD CONSTRAINT fk_restructure_new_schedule FOREIGN KEY (new_schedule_id) REFERENCES public.loan_schedules(id);


--
-- Name: loan_restructures fk_restructure_new_schedule_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_restructures
    ADD CONSTRAINT fk_restructure_new_schedule_tenant FOREIGN KEY (tenant_id, new_schedule_id) REFERENCES public.loan_schedules(tenant_id, id);


--
-- Name: loan_restructures fk_restructure_previous_schedule; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_restructures
    ADD CONSTRAINT fk_restructure_previous_schedule FOREIGN KEY (previous_schedule_id) REFERENCES public.loan_schedules(id);


--
-- Name: loan_restructures fk_restructure_previous_schedule_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_restructures
    ADD CONSTRAINT fk_restructure_previous_schedule_tenant FOREIGN KEY (tenant_id, previous_schedule_id) REFERENCES public.loan_schedules(tenant_id, id);


--
-- Name: loan_product_rules fk_rule_product_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_rules
    ADD CONSTRAINT fk_rule_product_tenant FOREIGN KEY (tenant_id, loan_product_id) REFERENCES public.loan_products(tenant_id, id);


--
-- Name: loan_schedules fk_schedule_loan_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_schedules
    ADD CONSTRAINT fk_schedule_loan_tenant FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_schedules fk_schedule_offer_schedule_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_schedules
    ADD CONSTRAINT fk_schedule_offer_schedule_tenant FOREIGN KEY (tenant_id, offer_schedule_id) REFERENCES public.loan_offer_schedules(tenant_id, id);


--
-- Name: loan_status_history fk_status_history_loan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_status_history
    ADD CONSTRAINT fk_status_history_loan FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_product_tiers fk_tier_product_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_tiers
    ADD CONSTRAINT fk_tier_product_tenant FOREIGN KEY (tenant_id, loan_product_id) REFERENCES public.loan_products(tenant_id, id);


--
-- Name: loan_product_versions fk_version_product_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_versions
    ADD CONSTRAINT fk_version_product_tenant FOREIGN KEY (tenant_id, loan_product_id) REFERENCES public.loan_products(tenant_id, id);


--
-- Name: loan_write_offs fk_writeoff_loan_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_offs
    ADD CONSTRAINT fk_writeoff_loan_tenant FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_write_offs fk_writeoff_version_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_offs
    ADD CONSTRAINT fk_writeoff_version_tenant FOREIGN KEY (tenant_id, product_version_id) REFERENCES public.loan_product_versions(tenant_id, id);


--
-- Name: loan_automated_evaluations loan_automated_evaluations_tenant_id_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_automated_evaluations
    ADD CONSTRAINT loan_automated_evaluations_tenant_id_application_id_fkey FOREIGN KEY (tenant_id, application_id) REFERENCES public.loan_applications(tenant_id, id);


--
-- Name: loan_automated_rule_results loan_automated_rule_results_tenant_id_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_automated_rule_results
    ADD CONSTRAINT loan_automated_rule_results_tenant_id_application_id_fkey FOREIGN KEY (tenant_id, application_id) REFERENCES public.loan_applications(tenant_id, id);


--
-- Name: loan_automated_rule_results loan_automated_rule_results_tenant_id_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_automated_rule_results
    ADD CONSTRAINT loan_automated_rule_results_tenant_id_evaluation_id_fkey FOREIGN KEY (tenant_id, evaluation_id) REFERENCES public.loan_automated_evaluations(tenant_id, id);


--
-- Name: loan_delinquency_assessments loan_delinquency_assessments_tenant_id_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_delinquency_assessments
    ADD CONSTRAINT loan_delinquency_assessments_tenant_id_loan_id_fkey FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_disbursement_saga_steps loan_disbursement_saga_steps_tenant_id_disbursement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_disbursement_saga_steps
    ADD CONSTRAINT loan_disbursement_saga_steps_tenant_id_disbursement_id_fkey FOREIGN KEY (tenant_id, disbursement_id) REFERENCES public.loan_disbursements(tenant_id, id);


--
-- Name: loan_manual_decision_conditions loan_manual_decision_condition_tenant_id_recommendation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_decision_conditions
    ADD CONSTRAINT loan_manual_decision_condition_tenant_id_recommendation_id_fkey FOREIGN KEY (tenant_id, recommendation_id) REFERENCES public.loan_manual_review_recommendations(tenant_id, id);


--
-- Name: loan_manual_review_assignments loan_manual_review_assignments_tenant_id_review_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_review_assignments
    ADD CONSTRAINT loan_manual_review_assignments_tenant_id_review_case_id_fkey FOREIGN KEY (tenant_id, review_case_id) REFERENCES public.loan_manual_review_cases(tenant_id, id);


--
-- Name: loan_manual_review_cases loan_manual_review_cases_tenant_id_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_review_cases
    ADD CONSTRAINT loan_manual_review_cases_tenant_id_application_id_fkey FOREIGN KEY (tenant_id, application_id) REFERENCES public.loan_applications(tenant_id, id);


--
-- Name: loan_manual_review_recommendations loan_manual_review_recommendation_tenant_id_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_review_recommendations
    ADD CONSTRAINT loan_manual_review_recommendation_tenant_id_application_id_fkey FOREIGN KEY (tenant_id, application_id) REFERENCES public.loan_applications(tenant_id, id);


--
-- Name: loan_manual_review_recommendations loan_manual_review_recommendation_tenant_id_review_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_manual_review_recommendations
    ADD CONSTRAINT loan_manual_review_recommendation_tenant_id_review_case_id_fkey FOREIGN KEY (tenant_id, review_case_id) REFERENCES public.loan_manual_review_cases(tenant_id, id);


--
-- Name: loan_offer_acceptances loan_offer_acceptances_tenant_id_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_acceptances
    ADD CONSTRAINT loan_offer_acceptances_tenant_id_offer_id_fkey FOREIGN KEY (tenant_id, offer_id) REFERENCES public.loan_offers(tenant_id, id);


--
-- Name: loan_offer_fee_lines loan_offer_fee_lines_tenant_id_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_fee_lines
    ADD CONSTRAINT loan_offer_fee_lines_tenant_id_offer_id_fkey FOREIGN KEY (tenant_id, offer_id) REFERENCES public.loan_offers(tenant_id, id);


--
-- Name: loan_offer_installments loan_offer_installments_tenant_id_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_installments
    ADD CONSTRAINT loan_offer_installments_tenant_id_schedule_id_fkey FOREIGN KEY (tenant_id, schedule_id) REFERENCES public.loan_offer_schedules(tenant_id, id);


--
-- Name: loan_offer_schedules loan_offer_schedules_tenant_id_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offer_schedules
    ADD CONSTRAINT loan_offer_schedules_tenant_id_offer_id_fkey FOREIGN KEY (tenant_id, offer_id) REFERENCES public.loan_offers(tenant_id, id);


--
-- Name: loan_penalty_assessments loan_penalty_assessments_tenant_id_installment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_penalty_assessments
    ADD CONSTRAINT loan_penalty_assessments_tenant_id_installment_id_fkey FOREIGN KEY (tenant_id, installment_id) REFERENCES public.loan_installments(tenant_id, id);


--
-- Name: loan_penalty_assessments loan_penalty_assessments_tenant_id_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_penalty_assessments
    ADD CONSTRAINT loan_penalty_assessments_tenant_id_loan_id_fkey FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_penalty_assessments loan_penalty_assessments_tenant_id_product_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_penalty_assessments
    ADD CONSTRAINT loan_penalty_assessments_tenant_id_product_version_id_fkey FOREIGN KEY (tenant_id, product_version_id) REFERENCES public.loan_product_versions(tenant_id, id);


--
-- Name: loan_product_version_history loan_product_version_history_tenant_id_loan_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_version_history
    ADD CONSTRAINT loan_product_version_history_tenant_id_loan_product_id_fkey FOREIGN KEY (tenant_id, loan_product_id) REFERENCES public.loan_products(tenant_id, id);


--
-- Name: loan_product_version_history loan_product_version_history_tenant_id_product_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_version_history
    ADD CONSTRAINT loan_product_version_history_tenant_id_product_version_id_fkey FOREIGN KEY (tenant_id, product_version_id) REFERENCES public.loan_product_versions(tenant_id, id);


--
-- Name: loan_quotes loan_quotes_tenant_id_product_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_quotes
    ADD CONSTRAINT loan_quotes_tenant_id_product_version_id_fkey FOREIGN KEY (tenant_id, product_version_id) REFERENCES public.loan_product_versions(tenant_id, id);


--
-- Name: loan_repayment_allocation_batches loan_repayment_allocation_bat_tenant_id_product_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocation_batches
    ADD CONSTRAINT loan_repayment_allocation_bat_tenant_id_product_version_id_fkey FOREIGN KEY (tenant_id, product_version_id) REFERENCES public.loan_product_versions(tenant_id, id);


--
-- Name: loan_repayment_allocation_batches loan_repayment_allocation_batches_tenant_id_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocation_batches
    ADD CONSTRAINT loan_repayment_allocation_batches_tenant_id_loan_id_fkey FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_repayment_allocation_batches loan_repayment_allocation_batches_tenant_id_repayment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocation_batches
    ADD CONSTRAINT loan_repayment_allocation_batches_tenant_id_repayment_id_fkey FOREIGN KEY (tenant_id, repayment_id) REFERENCES public.loan_repayments(tenant_id, id);


--
-- Name: loan_repayment_allocation_lines loan_repayment_allocation_lines_tenant_id_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocation_lines
    ADD CONSTRAINT loan_repayment_allocation_lines_tenant_id_batch_id_fkey FOREIGN KEY (tenant_id, batch_id) REFERENCES public.loan_repayment_allocation_batches(tenant_id, id);


--
-- Name: loan_repayment_allocation_lines loan_repayment_allocation_lines_tenant_id_installment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_allocation_lines
    ADD CONSTRAINT loan_repayment_allocation_lines_tenant_id_installment_id_fkey FOREIGN KEY (tenant_id, installment_id) REFERENCES public.loan_installments(tenant_id, id);


--
-- Name: loan_repayment_lifecycle_history loan_repayment_lifecycle_history_tenant_id_repayment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_lifecycle_history
    ADD CONSTRAINT loan_repayment_lifecycle_history_tenant_id_repayment_id_fkey FOREIGN KEY (tenant_id, repayment_id) REFERENCES public.loan_repayments(tenant_id, id);


--
-- Name: loan_repayment_quotes loan_repayment_quotes_tenant_id_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_quotes
    ADD CONSTRAINT loan_repayment_quotes_tenant_id_loan_id_fkey FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_repayment_requests loan_repayment_requests_tenant_id_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_requests
    ADD CONSTRAINT loan_repayment_requests_tenant_id_loan_id_fkey FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_repayment_requests loan_repayment_requests_tenant_id_repayment_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_requests
    ADD CONSTRAINT loan_repayment_requests_tenant_id_repayment_quote_id_fkey FOREIGN KEY (tenant_id, repayment_quote_id) REFERENCES public.loan_repayment_quotes(tenant_id, id);


--
-- Name: loan_repayment_reversals loan_repayment_reversals_tenant_id_allocation_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_reversals
    ADD CONSTRAINT loan_repayment_reversals_tenant_id_allocation_batch_id_fkey FOREIGN KEY (tenant_id, allocation_batch_id) REFERENCES public.loan_repayment_allocation_batches(tenant_id, id);


--
-- Name: loan_repayment_reversals loan_repayment_reversals_tenant_id_repayment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_reversals
    ADD CONSTRAINT loan_repayment_reversals_tenant_id_repayment_id_fkey FOREIGN KEY (tenant_id, repayment_id) REFERENCES public.loan_repayments(tenant_id, id);


--
-- Name: loan_repayment_reversals loan_repayment_reversals_tenant_id_reversal_of_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_reversals
    ADD CONSTRAINT loan_repayment_reversals_tenant_id_reversal_of_id_fkey FOREIGN KEY (tenant_id, reversal_of_id) REFERENCES public.loan_repayment_reversals(tenant_id, id);


--
-- Name: loan_restructure_history loan_restructure_history_tenant_id_restructure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_restructure_history
    ADD CONSTRAINT loan_restructure_history_tenant_id_restructure_id_fkey FOREIGN KEY (tenant_id, restructure_id) REFERENCES public.loan_restructures(tenant_id, id);


--
-- Name: loan_unapplied_credits loan_unapplied_credits_tenant_id_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_unapplied_credits
    ADD CONSTRAINT loan_unapplied_credits_tenant_id_loan_id_fkey FOREIGN KEY (tenant_id, loan_id) REFERENCES public.loans(tenant_id, id);


--
-- Name: loan_unapplied_credits loan_unapplied_credits_tenant_id_repayment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_unapplied_credits
    ADD CONSTRAINT loan_unapplied_credits_tenant_id_repayment_id_fkey FOREIGN KEY (tenant_id, repayment_id) REFERENCES public.loan_repayments(tenant_id, id);


--
-- Name: loan_writeoff_history loan_writeoff_history_tenant_id_writeoff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_writeoff_history
    ADD CONSTRAINT loan_writeoff_history_tenant_id_writeoff_id_fkey FOREIGN KEY (tenant_id, writeoff_id) REFERENCES public.loan_write_offs(tenant_id, id);


--
-- Name: loan_adjustments adjustments_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY adjustments_tenant_policy ON public.loan_adjustments USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_application_decisions application_decisions_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY application_decisions_tenant_policy ON public.loan_application_decisions USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_application_documents application_documents_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY application_documents_tenant_policy ON public.loan_application_documents USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_application_events application_events_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY application_events_tenant_policy ON public.loan_application_events USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_application_reviews application_reviews_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY application_reviews_tenant_policy ON public.loan_application_reviews USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_asset_disbursements asset_disbursements_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY asset_disbursements_tenant_policy ON public.loan_asset_disbursements USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_automated_evaluations automated_evaluation_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY automated_evaluation_tenant_policy ON public.loan_automated_evaluations USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_automated_rule_results automated_rule_result_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY automated_rule_result_tenant_policy ON public.loan_automated_rule_results USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_contracts contracts_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contracts_tenant_policy ON public.loan_contracts USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_delinquency_assessments delinquency_assessment_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY delinquency_assessment_tenant_policy ON public.loan_delinquency_assessments USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_direct_debit_mandates direct_debit_mandates_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY direct_debit_mandates_tenant_policy ON public.loan_direct_debit_mandates USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_disbursement_saga_steps disbursement_step_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY disbursement_step_tenant_policy ON public.loan_disbursement_saga_steps USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_inbox_events inbox_events_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY inbox_events_tenant_policy ON public.loan_inbox_events USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_interest_accruals interest_accruals_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY interest_accruals_tenant_policy ON public.loan_interest_accruals USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: lending_ledger_posting_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lending_ledger_posting_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: lending_ledger_posting_requests lending_postings_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lending_postings_tenant_policy ON public.lending_ledger_posting_requests USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_adjustments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_adjustments ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_application_decisions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_application_decisions ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_application_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_application_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_application_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_application_events ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_application_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_application_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_applications loan_applications_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_applications_tenant_policy ON public.loan_applications USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)) WITH CHECK ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: loan_asset_disbursements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_asset_disbursements ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_assets loan_assets_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_assets_tenant_policy ON public.loan_assets USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)) WITH CHECK ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: loan_automated_evaluations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_automated_evaluations ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_automated_rule_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_automated_rule_results ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_collaterals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_collaterals ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_collaterals loan_collaterals_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_collaterals_tenant_policy ON public.loan_collaterals USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)) WITH CHECK ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: loan_collections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_collections ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_collections loan_collections_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_collections_tenant_policy ON public.loan_collections USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)) WITH CHECK ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: loan_contracts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_delinquency_assessments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_delinquency_assessments ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_direct_debit_mandates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_direct_debit_mandates ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_disbursement_saga_steps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_disbursement_saga_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_disbursements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_disbursements ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_disbursements loan_disbursements_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_disbursements_tenant_policy ON public.loan_disbursements USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)) WITH CHECK ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: loan_idempotency_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_idempotency_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_idempotency_keys loan_idempotency_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_idempotency_tenant_policy ON public.loan_idempotency_keys USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)) WITH CHECK ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: loan_inbox_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_inbox_events ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_installments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_installments ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_installments loan_installments_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_installments_tenant_policy ON public.loan_installments USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)) WITH CHECK ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: loan_interest_accruals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_interest_accruals ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_manual_decision_conditions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_manual_decision_conditions ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_manual_review_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_manual_review_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_manual_review_cases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_manual_review_cases ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_manual_review_recommendations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_manual_review_recommendations ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_offer_acceptances; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_offer_acceptances ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_offer_fee_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_offer_fee_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_offer_installments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_offer_installments ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_offer_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_offer_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_offers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_offers ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_outbox_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_outbox_events ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_outbox_events loan_outbox_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_outbox_tenant_policy ON public.loan_outbox_events USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)) WITH CHECK ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: loan_parties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_parties ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_parties loan_parties_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_parties_tenant_policy ON public.loan_parties USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_payment_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_payment_links ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_penalty_assessments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_penalty_assessments ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_product_fees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_product_fees ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_product_fees loan_product_fees_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_product_fees_tenant_policy ON public.loan_product_fees USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_product_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_product_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_product_rules loan_product_rules_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_product_rules_tenant_policy ON public.loan_product_rules USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_product_tiers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_product_tiers ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_product_tiers loan_product_tiers_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_product_tiers_tenant_policy ON public.loan_product_tiers USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_product_version_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_product_version_history ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_product_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_product_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_products ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_products loan_products_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_products_tenant_policy ON public.loan_products USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)) WITH CHECK ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: loan_quotes loan_quote_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_quote_tenant_policy ON public.loan_quotes USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_quotes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_quotes ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_repayment_allocation_batches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_repayment_allocation_batches ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_repayment_allocation_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_repayment_allocation_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_repayment_allocations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_repayment_allocations ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_repayment_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_repayment_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_repayment_lifecycle_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_repayment_lifecycle_history ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_repayment_quotes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_repayment_quotes ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_repayment_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_repayment_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_repayment_reversals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_repayment_reversals ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_repayments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_repayments loan_repayments_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_repayments_tenant_policy ON public.loan_repayments USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)) WITH CHECK ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: loan_restructure_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_restructure_history ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_restructures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_restructures ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_schedules loan_schedules_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_schedules_tenant_policy ON public.loan_schedules USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_servicing_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_servicing_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_status_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_status_history ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_unapplied_credits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_unapplied_credits ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_write_off_recoveries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_write_off_recoveries ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_write_offs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_write_offs ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_writeoff_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_writeoff_history ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_write_offs loan_writeoffs_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_writeoffs_tenant_policy ON public.loan_write_offs USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)) WITH CHECK ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: loans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

--
-- Name: loans loans_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loans_tenant_policy ON public.loans USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)) WITH CHECK ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


--
-- Name: loan_manual_review_assignments manual_assignment_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY manual_assignment_tenant_policy ON public.loan_manual_review_assignments USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_manual_review_cases manual_case_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY manual_case_tenant_policy ON public.loan_manual_review_cases USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_manual_decision_conditions manual_condition_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY manual_condition_tenant_policy ON public.loan_manual_decision_conditions USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_manual_review_recommendations manual_recommendation_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY manual_recommendation_tenant_policy ON public.loan_manual_review_recommendations USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_offer_acceptances offer_acceptance_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY offer_acceptance_tenant_policy ON public.loan_offer_acceptances USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_offer_fee_lines offer_fee_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY offer_fee_tenant_policy ON public.loan_offer_fee_lines USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_offer_installments offer_installment_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY offer_installment_tenant_policy ON public.loan_offer_installments USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_offer_schedules offer_schedule_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY offer_schedule_tenant_policy ON public.loan_offer_schedules USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_offers offers_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY offers_tenant_policy ON public.loan_offers USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_payment_links payment_links_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY payment_links_tenant_policy ON public.loan_payment_links USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_penalty_assessments penalty_assessment_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY penalty_assessment_tenant_policy ON public.loan_penalty_assessments USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_product_version_history product_version_history_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY product_version_history_tenant_policy ON public.loan_product_version_history USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_product_versions product_versions_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY product_versions_tenant_policy ON public.loan_product_versions USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_repayment_allocations repayment_allocations_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY repayment_allocations_tenant_policy ON public.loan_repayment_allocations USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_repayment_attempts repayment_attempts_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY repayment_attempts_tenant_policy ON public.loan_repayment_attempts USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_repayment_allocation_batches repayment_batch_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY repayment_batch_tenant_policy ON public.loan_repayment_allocation_batches USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_repayment_lifecycle_history repayment_history_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY repayment_history_tenant_policy ON public.loan_repayment_lifecycle_history USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_repayment_allocation_lines repayment_line_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY repayment_line_tenant_policy ON public.loan_repayment_allocation_lines USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_repayment_quotes repayment_quote_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY repayment_quote_tenant_policy ON public.loan_repayment_quotes USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_repayment_requests repayment_request_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY repayment_request_tenant_policy ON public.loan_repayment_requests USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_repayment_reversals repayment_reversal_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY repayment_reversal_tenant_policy ON public.loan_repayment_reversals USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_restructure_history restructure_history_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY restructure_history_tenant_policy ON public.loan_restructure_history USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_restructures restructures_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY restructures_tenant_policy ON public.loan_restructures USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_servicing_runs servicing_run_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY servicing_run_tenant_policy ON public.loan_servicing_runs USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_status_history status_history_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY status_history_tenant_policy ON public.loan_status_history USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_unapplied_credits unapplied_credit_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY unapplied_credit_tenant_policy ON public.loan_unapplied_credits USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_writeoff_history writeoff_history_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY writeoff_history_tenant_policy ON public.loan_writeoff_history USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_write_off_recoveries writeoff_recoveries_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY writeoff_recoveries_tenant_policy ON public.loan_write_off_recoveries USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- PostgreSQL database dump complete
--


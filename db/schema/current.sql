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
    'SALARY'
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
    amount numeric(20,2) NOT NULL,
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
    CONSTRAINT chk_lending_ledger_posting_amount CHECK ((amount > (0)::numeric)),
    CONSTRAINT chk_lending_ledger_posting_currency CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT chk_lending_posting_attempts CHECK ((attempt_count >= 0))
);


--
-- Name: loan_adjustments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_adjustments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    adjustment_type public.adjustment_type_enum NOT NULL,
    amount numeric(20,2) NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    reason text NOT NULL,
    ledger_transaction_id uuid,
    approved_by uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_adjustment_amount CHECK ((amount > (0)::numeric))
);


--
-- Name: loan_application_decisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_application_decisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    application_id uuid NOT NULL,
    decision public.loan_decision_enum NOT NULL,
    approved_amount numeric(20,2),
    approved_tenure_days integer,
    approved_interest_rate numeric(10,6),
    decision_reason text,
    decision_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    decided_by uuid,
    decided_at timestamp with time zone DEFAULT now() NOT NULL
);


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


--
-- Name: loan_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    loan_product_id uuid NOT NULL,
    application_number character varying(100) NOT NULL,
    requested_amount numeric(20,2) NOT NULL,
    approved_amount numeric(20,2),
    requested_tenure_days integer NOT NULL,
    approved_tenure_days integer,
    requested_interest_rate numeric(10,6),
    approved_interest_rate numeric(10,6),
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
    CONSTRAINT chk_application_amount CHECK ((requested_amount > (0)::numeric)),
    CONSTRAINT chk_application_tenure CHECK ((requested_tenure_days > 0))
);


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
    document_hash character varying(128) NOT NULL,
    terms_snapshot jsonb NOT NULL,
    borrower_consent_reference character varying(255),
    borrower_signed_at timestamp with time zone,
    lender_signed_at timestamp with time zone,
    effective_at timestamp with time zone,
    terminated_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


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


--
-- Name: loan_disbursements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_disbursements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    disbursement_reference character varying(100) NOT NULL,
    destination_account_id uuid,
    amount numeric(20,2) NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    status public.disbursement_status_enum DEFAULT 'PENDING'::public.disbursement_status_enum NOT NULL,
    payment_transaction_id uuid,
    ledger_transaction_id uuid,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    failure_reason text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_disbursement_amount CHECK ((amount > (0)::numeric))
);


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
    principal_due numeric(20,2) DEFAULT 0 NOT NULL,
    interest_due numeric(20,2) DEFAULT 0 NOT NULL,
    fees_due numeric(20,2) DEFAULT 0 NOT NULL,
    penalty_due numeric(20,2) DEFAULT 0 NOT NULL,
    total_due numeric(20,2) NOT NULL,
    principal_paid numeric(20,2) DEFAULT 0 NOT NULL,
    interest_paid numeric(20,2) DEFAULT 0 NOT NULL,
    fees_paid numeric(20,2) DEFAULT 0 NOT NULL,
    penalty_paid numeric(20,2) DEFAULT 0 NOT NULL,
    total_paid numeric(20,2) DEFAULT 0 NOT NULL,
    status public.installment_status_enum DEFAULT 'PENDING'::public.installment_status_enum NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_installment_amounts CHECK (((principal_due >= (0)::numeric) AND (interest_due >= (0)::numeric) AND (fees_due >= (0)::numeric) AND (penalty_due >= (0)::numeric) AND (principal_paid >= (0)::numeric) AND (interest_paid >= (0)::numeric) AND (fees_paid >= (0)::numeric) AND (penalty_paid >= (0)::numeric))),
    CONSTRAINT chk_installment_due_total CHECK ((total_due = (((principal_due + interest_due) + fees_due) + penalty_due))),
    CONSTRAINT chk_installment_paid_total CHECK ((total_paid = (((principal_paid + interest_paid) + fees_paid) + penalty_paid)))
);


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
    opening_principal numeric(20,2) NOT NULL,
    annualized_rate numeric(10,6) NOT NULL,
    day_count_numerator integer NOT NULL,
    day_count_denominator integer NOT NULL,
    interest_amount numeric(20,2) NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    status public.accrual_status_enum DEFAULT 'PENDING'::public.accrual_status_enum NOT NULL,
    calculation_version character varying(50) NOT NULL,
    calculation_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    ledger_posting_request_id uuid,
    ledger_transaction_id uuid,
    reversal_of_id uuid,
    posted_at timestamp with time zone,
    reversed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_accrual_currency CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT chk_accrual_period CHECK ((period_end >= period_start)),
    CONSTRAINT chk_accrual_values CHECK (((opening_principal >= (0)::numeric) AND (annualized_rate >= (0)::numeric) AND (day_count_numerator > 0) AND (day_count_denominator > 0) AND (interest_amount >= (0)::numeric)))
);


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
    principal_amount numeric(20,2) NOT NULL,
    net_disbursement_amount numeric(20,2) NOT NULL,
    total_interest numeric(20,2) DEFAULT 0 NOT NULL,
    total_fees numeric(20,2) DEFAULT 0 NOT NULL,
    total_repayable numeric(20,2) NOT NULL,
    interest_rate numeric(10,6) NOT NULL,
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
    CONSTRAINT chk_offer_amounts CHECK (((principal_amount > (0)::numeric) AND (net_disbursement_amount >= (0)::numeric) AND (total_interest >= (0)::numeric) AND (total_fees >= (0)::numeric) AND (total_repayable = ((principal_amount + total_interest) + total_fees)))),
    CONSTRAINT chk_offer_currency CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT chk_offer_expiry CHECK (((issued_at IS NULL) OR (expires_at > issued_at))),
    CONSTRAINT chk_offer_rate_tenure CHECK (((interest_rate >= (0)::numeric) AND (tenure_days > 0)))
);


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
    CONSTRAINT chk_loan_outbox_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PUBLISHED'::character varying, 'FAILED'::character varying])::text[])))
);


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


--
-- Name: loan_product_fees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_product_fees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_product_id uuid NOT NULL,
    fee_type public.fee_type_enum NOT NULL,
    fee_name character varying(100) NOT NULL,
    percentage_rate numeric(10,6),
    fixed_amount numeric(20,2),
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    is_capitalized boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_fee_fixed CHECK (((fixed_amount IS NULL) OR (fixed_amount >= (0)::numeric))),
    CONSTRAINT chk_fee_percentage CHECK (((percentage_rate IS NULL) OR (percentage_rate >= (0)::numeric))),
    CONSTRAINT chk_fee_value CHECK ((((percentage_rate IS NOT NULL) AND (fixed_amount IS NULL)) OR ((percentage_rate IS NULL) AND (fixed_amount IS NOT NULL))))
);


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


--
-- Name: loan_product_tiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_product_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_product_id uuid NOT NULL,
    tier_code character varying(50) NOT NULL,
    min_amount numeric(20,2),
    max_amount numeric(20,2),
    interest_rate numeric(10,6),
    max_active_loans integer,
    max_total_exposure numeric(20,2),
    max_tenure_days integer,
    eligibility_rules jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_product_tier_amount CHECK (((min_amount IS NULL) OR (max_amount IS NULL) OR (max_amount >= min_amount)))
);


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
    min_amount numeric(20,2) NOT NULL,
    max_amount numeric(20,2) NOT NULL,
    min_tenure_days integer NOT NULL,
    max_tenure_days integer NOT NULL,
    interest_rate numeric(10,6) NOT NULL,
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
    published_at timestamp with time zone DEFAULT now() NOT NULL,
    published_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_product_version_amount CHECK (((min_amount > (0)::numeric) AND (max_amount >= min_amount))),
    CONSTRAINT chk_product_version_currency CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT chk_product_version_dates CHECK (((effective_to IS NULL) OR (effective_to > effective_from))),
    CONSTRAINT chk_product_version_rate CHECK ((interest_rate >= (0)::numeric)),
    CONSTRAINT chk_product_version_tenure CHECK (((min_tenure_days > 0) AND (max_tenure_days >= min_tenure_days)))
);


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
    min_amount numeric(20,2) NOT NULL,
    max_amount numeric(20,2) NOT NULL,
    min_tenure_days integer NOT NULL,
    max_tenure_days integer NOT NULL,
    interest_rate numeric(10,6) NOT NULL,
    interest_type public.interest_type_enum NOT NULL,
    repayment_frequency public.repayment_frequency_enum NOT NULL,
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
    repayment_allocation_order jsonb DEFAULT '["PENALTY", "FEE", "INTEREST", "PRINCIPAL"]'::jsonb NOT NULL,
    CONSTRAINT chk_product_amount CHECK (((min_amount > (0)::numeric) AND (max_amount >= min_amount))),
    CONSTRAINT chk_product_currency CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT chk_product_day_count CHECK (((day_count_convention)::text = ANY ((ARRAY['ACTUAL_365'::character varying, 'ACTUAL_360'::character varying, 'THIRTY_360'::character varying, 'ACTUAL_ACTUAL'::character varying])::text[]))),
    CONSTRAINT chk_product_grace CHECK ((grace_period_days >= 0)),
    CONSTRAINT chk_product_interest CHECK ((interest_rate >= (0)::numeric)),
    CONSTRAINT chk_product_tenure CHECK (((min_tenure_days > 0) AND (max_tenure_days >= min_tenure_days)))
);


--
-- Name: loan_repayment_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_repayment_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    repayment_id uuid NOT NULL,
    installment_id uuid,
    principal_amount numeric(20,2) DEFAULT 0 NOT NULL,
    interest_amount numeric(20,2) DEFAULT 0 NOT NULL,
    fee_amount numeric(20,2) DEFAULT 0 NOT NULL,
    penalty_amount numeric(20,2) DEFAULT 0 NOT NULL,
    total_amount numeric(20,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_allocation_amounts CHECK (((principal_amount >= (0)::numeric) AND (interest_amount >= (0)::numeric) AND (fee_amount >= (0)::numeric) AND (penalty_amount >= (0)::numeric) AND (total_amount >= (0)::numeric))),
    CONSTRAINT chk_allocation_total_components CHECK ((total_amount = (((principal_amount + interest_amount) + fee_amount) + penalty_amount)))
);


--
-- Name: loan_repayment_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_repayment_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    repayment_id uuid,
    attempt_number integer NOT NULL,
    amount numeric(20,2) NOT NULL,
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
    CONSTRAINT chk_repayment_attempt_amount CHECK ((amount > (0)::numeric))
);


--
-- Name: loan_repayments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_repayments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    repayment_reference character varying(100) NOT NULL,
    amount numeric(20,2) NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    method public.repayment_method_enum NOT NULL,
    status public.repayment_status_enum DEFAULT 'PENDING'::public.repayment_status_enum NOT NULL,
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
    CONSTRAINT chk_repayment_amount CHECK ((amount > (0)::numeric))
);


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
    previous_principal numeric(20,2),
    new_principal numeric(20,2),
    previous_interest_rate numeric(10,6),
    new_interest_rate numeric(10,6),
    previous_maturity_date date,
    new_maturity_date date,
    status public.restructure_status_enum DEFAULT 'REQUESTED'::public.restructure_status_enum NOT NULL,
    requested_by uuid,
    approved_by uuid,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    approved_at timestamp with time zone,
    implemented_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: loan_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    schedule_version integer DEFAULT 1 NOT NULL,
    effective_date date NOT NULL,
    total_principal numeric(20,2) NOT NULL,
    total_interest numeric(20,2) NOT NULL,
    total_fees numeric(20,2) DEFAULT 0 NOT NULL,
    total_amount numeric(20,2) NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_schedule_amounts CHECK (((total_principal >= (0)::numeric) AND (total_interest >= (0)::numeric) AND (total_fees >= (0)::numeric) AND (total_amount >= (0)::numeric))),
    CONSTRAINT chk_schedule_total_components CHECK ((total_amount = ((total_principal + total_interest) + total_fees)))
);


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
    amount numeric(20,2) NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    method public.repayment_method_enum NOT NULL,
    status public.writeoff_recovery_status_enum DEFAULT 'PENDING'::public.writeoff_recovery_status_enum NOT NULL,
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
    CONSTRAINT chk_recovery_amount CHECK ((amount > (0)::numeric)),
    CONSTRAINT chk_recovery_currency CHECK ((currency ~ '^[A-Z]{3}$'::text))
);


--
-- Name: loan_write_offs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_write_offs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    loan_id uuid NOT NULL,
    principal_amount numeric(20,2) DEFAULT 0 NOT NULL,
    interest_amount numeric(20,2) DEFAULT 0 NOT NULL,
    fees_amount numeric(20,2) DEFAULT 0 NOT NULL,
    penalties_amount numeric(20,2) DEFAULT 0 NOT NULL,
    total_amount numeric(20,2) NOT NULL,
    currency character(3) DEFAULT 'NGN'::bpchar NOT NULL,
    reason text NOT NULL,
    status public.writeoff_status_enum DEFAULT 'PENDING'::public.writeoff_status_enum NOT NULL,
    ledger_transaction_id uuid,
    requested_by uuid,
    approved_by uuid,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT chk_writeoff_amount CHECK ((total_amount > (0)::numeric)),
    CONSTRAINT chk_writeoff_total_components CHECK ((total_amount = (((principal_amount + interest_amount) + fees_amount) + penalties_amount)))
);


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
    principal_amount numeric(20,2) NOT NULL,
    approved_amount numeric(20,2) NOT NULL,
    interest_rate numeric(10,6) NOT NULL,
    interest_type public.interest_type_enum NOT NULL,
    tenure_days integer NOT NULL,
    repayment_frequency public.repayment_frequency_enum NOT NULL,
    status public.loan_status_enum DEFAULT 'APPROVED'::public.loan_status_enum NOT NULL,
    disbursed_amount numeric(20,2) DEFAULT 0 NOT NULL,
    outstanding_principal numeric(20,2) DEFAULT 0 NOT NULL,
    outstanding_interest numeric(20,2) DEFAULT 0 NOT NULL,
    outstanding_fees numeric(20,2) DEFAULT 0 NOT NULL,
    outstanding_penalties numeric(20,2) DEFAULT 0 NOT NULL,
    total_repaid numeric(20,2) DEFAULT 0 NOT NULL,
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
    CONSTRAINT chk_loan_approved CHECK ((approved_amount > (0)::numeric)),
    CONSTRAINT chk_loan_currency CHECK ((currency ~ '^[A-Z]{3}$'::text)),
    CONSTRAINT chk_loan_days_past_due CHECK ((days_past_due >= 0)),
    CONSTRAINT chk_loan_interest CHECK ((interest_rate >= (0)::numeric)),
    CONSTRAINT chk_loan_outstanding CHECK (((outstanding_principal >= (0)::numeric) AND (outstanding_interest >= (0)::numeric) AND (outstanding_fees >= (0)::numeric) AND (outstanding_penalties >= (0)::numeric) AND (total_repaid >= (0)::numeric))),
    CONSTRAINT chk_loan_principal CHECK ((principal_amount > (0)::numeric))
);


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
-- Name: loan_direct_debit_mandates loan_direct_debit_mandates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_direct_debit_mandates
    ADD CONSTRAINT loan_direct_debit_mandates_pkey PRIMARY KEY (id);


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
-- Name: loan_repayments loan_repayments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayments
    ADD CONSTRAINT loan_repayments_pkey PRIMARY KEY (id);


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
-- Name: loan_status_history loan_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_status_history
    ADD CONSTRAINT loan_status_history_pkey PRIMARY KEY (id);


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
-- Name: loan_applications uq_application_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_applications
    ADD CONSTRAINT uq_application_number UNIQUE (tenant_id, application_number);


--
-- Name: loan_applications uq_applications_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_applications
    ADD CONSTRAINT uq_applications_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_contracts uq_contract_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_contracts
    ADD CONSTRAINT uq_contract_reference UNIQUE (tenant_id, contract_reference);


--
-- Name: loan_contracts uq_contract_version; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_contracts
    ADD CONSTRAINT uq_contract_version UNIQUE (loan_id, contract_version);


--
-- Name: loan_disbursements uq_disbursement_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_disbursements
    ADD CONSTRAINT uq_disbursement_reference UNIQUE (tenant_id, disbursement_reference);


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
-- Name: loan_products uq_loan_product_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_products
    ADD CONSTRAINT uq_loan_product_code UNIQUE (tenant_id, product_code);


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
-- Name: loan_offers uq_offer_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offers
    ADD CONSTRAINT uq_offer_reference UNIQUE (tenant_id, offer_reference);


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
-- Name: loan_write_off_recoveries uq_recovery_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_off_recoveries
    ADD CONSTRAINT uq_recovery_reference UNIQUE (tenant_id, recovery_reference);


--
-- Name: loan_repayment_attempts uq_repayment_attempt; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_attempts
    ADD CONSTRAINT uq_repayment_attempt UNIQUE (loan_id, attempt_number);


--
-- Name: loan_repayments uq_repayment_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayments
    ADD CONSTRAINT uq_repayment_reference UNIQUE (tenant_id, repayment_reference);


--
-- Name: loan_repayments uq_repayments_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayments
    ADD CONSTRAINT uq_repayments_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_schedules uq_schedules_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_schedules
    ADD CONSTRAINT uq_schedules_tenant_id UNIQUE (tenant_id, id);


--
-- Name: loan_write_offs uq_writeoffs_tenant_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_write_offs
    ADD CONSTRAINT uq_writeoffs_tenant_id UNIQUE (tenant_id, id);


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
-- Name: idx_status_history_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_status_history_tenant ON public.loan_status_history USING btree (tenant_id, loan_id, created_at DESC);


--
-- Name: idx_writeoff_recoveries_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_writeoff_recoveries_loan ON public.loan_write_off_recoveries USING btree (tenant_id, loan_id, created_at DESC);


--
-- Name: idx_writeoff_recoveries_writeoff; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_writeoff_recoveries_writeoff ON public.loan_write_off_recoveries USING btree (write_off_id);


--
-- Name: uq_accepted_offer_per_application; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_accepted_offer_per_application ON public.loan_offers USING btree (application_id) WHERE (status = 'ACCEPTED'::public.loan_offer_status_enum);


--
-- Name: uq_active_contract_per_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_active_contract_per_loan ON public.loan_contracts USING btree (loan_id) WHERE (status = 'ACTIVE'::public.loan_contract_status_enum);


--
-- Name: uq_active_schedule_per_loan; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_active_schedule_per_loan ON public.loan_schedules USING btree (loan_id) WHERE is_active;


--
-- Name: uq_current_product_version; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_current_product_version ON public.loan_product_versions USING btree (loan_product_id) WHERE is_current;


--
-- Name: uq_disbursement_ledger_tx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_disbursement_ledger_tx ON public.loan_disbursements USING btree (ledger_transaction_id) WHERE (ledger_transaction_id IS NOT NULL);


--
-- Name: uq_disbursement_payment_tx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_disbursement_payment_tx ON public.loan_disbursements USING btree (payment_transaction_id) WHERE (payment_transaction_id IS NOT NULL);


--
-- Name: uq_lending_posting_ledger_tx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_lending_posting_ledger_tx ON public.lending_ledger_posting_requests USING btree (ledger_transaction_id) WHERE (ledger_transaction_id IS NOT NULL);


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
-- Name: loan_contracts fk_contract_loan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_contracts
    ADD CONSTRAINT fk_contract_loan FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: loan_contracts fk_contract_offer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_contracts
    ADD CONSTRAINT fk_contract_offer FOREIGN KEY (offer_id) REFERENCES public.loan_offers(id);


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
-- Name: loan_offers fk_offer_application; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offers
    ADD CONSTRAINT fk_offer_application FOREIGN KEY (application_id) REFERENCES public.loan_applications(id);


--
-- Name: loan_offers fk_offer_decision; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offers
    ADD CONSTRAINT fk_offer_decision FOREIGN KEY (decision_id) REFERENCES public.loan_application_decisions(id);


--
-- Name: loan_offers fk_offer_product_version; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_offers
    ADD CONSTRAINT fk_offer_product_version FOREIGN KEY (loan_product_version_id) REFERENCES public.loan_product_versions(id);


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
-- Name: loan_product_rules fk_product_rule_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_rules
    ADD CONSTRAINT fk_product_rule_product FOREIGN KEY (loan_product_id) REFERENCES public.loan_products(id) ON DELETE CASCADE;


--
-- Name: loan_product_tiers fk_product_tier_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_tiers
    ADD CONSTRAINT fk_product_tier_product FOREIGN KEY (loan_product_id) REFERENCES public.loan_products(id) ON DELETE CASCADE;


--
-- Name: loan_product_versions fk_product_version_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_product_versions
    ADD CONSTRAINT fk_product_version_product FOREIGN KEY (loan_product_id) REFERENCES public.loan_products(id);


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
-- Name: loan_repayment_attempts fk_repayment_attempt_repayment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_repayment_attempts
    ADD CONSTRAINT fk_repayment_attempt_repayment FOREIGN KEY (repayment_id) REFERENCES public.loan_repayments(id);


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
-- Name: loan_restructures fk_restructure_new_schedule; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_restructures
    ADD CONSTRAINT fk_restructure_new_schedule FOREIGN KEY (new_schedule_id) REFERENCES public.loan_schedules(id);


--
-- Name: loan_restructures fk_restructure_previous_schedule; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_restructures
    ADD CONSTRAINT fk_restructure_previous_schedule FOREIGN KEY (previous_schedule_id) REFERENCES public.loan_schedules(id);


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
-- Name: loan_contracts contracts_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contracts_tenant_policy ON public.loan_contracts USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_direct_debit_mandates direct_debit_mandates_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY direct_debit_mandates_tenant_policy ON public.loan_direct_debit_mandates USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


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
-- Name: loan_direct_debit_mandates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_direct_debit_mandates ENABLE ROW LEVEL SECURITY;

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
-- Name: loan_repayment_allocations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_repayment_allocations ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_repayment_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_repayment_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_repayments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_repayments loan_repayments_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY loan_repayments_tenant_policy ON public.loan_repayments USING ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid)) WITH CHECK ((tenant_id = (current_setting('app.current_tenant_id'::text, true))::uuid));


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
-- Name: loan_status_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_status_history ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_write_off_recoveries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_write_off_recoveries ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_write_offs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_write_offs ENABLE ROW LEVEL SECURITY;

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
-- Name: loan_offers offers_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY offers_tenant_policy ON public.loan_offers USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_payment_links payment_links_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY payment_links_tenant_policy ON public.loan_payment_links USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


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
-- Name: loan_restructures restructures_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY restructures_tenant_policy ON public.loan_restructures USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_status_history status_history_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY status_history_tenant_policy ON public.loan_status_history USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- Name: loan_write_off_recoveries writeoff_recoveries_tenant_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY writeoff_recoveries_tenant_policy ON public.loan_write_off_recoveries USING ((tenant_id = public.current_tenant_uuid())) WITH CHECK ((tenant_id = public.current_tenant_uuid()));


--
-- PostgreSQL database dump complete
--


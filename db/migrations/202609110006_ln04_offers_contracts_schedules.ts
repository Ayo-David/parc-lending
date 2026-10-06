import type { Knex } from "knex";

export const config = { transaction: false };

/** Approved LENDING-DB-45 through LENDING-DB-59. */
export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("loan_offer_schedules")) return;
  await knex.raw(`
    ALTER TABLE public.loan_offers
      ALTER COLUMN principal_amount TYPE bigint USING round(principal_amount*100)::bigint,
      ALTER COLUMN net_disbursement_amount TYPE bigint USING round(net_disbursement_amount*100)::bigint,
      ALTER COLUMN total_interest TYPE bigint USING round(total_interest*100)::bigint,
      ALTER COLUMN total_fees TYPE bigint USING round(total_fees*100)::bigint,
      ALTER COLUMN total_repayable TYPE bigint USING round(total_repayable*100)::bigint,
      ALTER COLUMN interest_rate TYPE numeric(18,10),
      ADD COLUMN configuration_hash char(64), ADD COLUMN calculation_version varchar(50),
      ADD COLUMN calculation_input_hash char(64), ADD COLUMN calculation_output_hash char(64),
      ADD COLUMN rounding_mode varchar(30), ADD COLUMN day_count_convention varchar(20),
      ADD COLUMN unrounded_interest numeric(30,12), ADD COLUMN rounding_residual bigint NOT NULL DEFAULT 0,
      ADD COLUMN idempotency_key varchar(255), ADD COLUMN request_hash char(64), ADD COLUMN correlation_id uuid,
      ADD COLUMN document_reference varchar(500), ADD COLUMN document_hash char(64),
      ADD COLUMN retention_until date NOT NULL DEFAULT (current_date + 2557), ADD COLUMN legal_hold boolean NOT NULL DEFAULT false,
      ADD CONSTRAINT uq_offer_tenant_id UNIQUE(tenant_id,id),
      ADD CONSTRAINT uq_offer_idempotency UNIQUE(tenant_id,idempotency_key),
      ADD CONSTRAINT chk_offer_ngn CHECK(currency='NGN'),
      ADD CONSTRAINT chk_offer_calculation CHECK(status='DRAFT' OR
        (configuration_hash IS NOT NULL AND calculation_version IS NOT NULL AND calculation_input_hash IS NOT NULL
         AND calculation_output_hash IS NOT NULL AND rounding_mode IS NOT NULL AND day_count_convention IS NOT NULL
         AND unrounded_interest IS NOT NULL AND document_reference IS NOT NULL AND document_hash IS NOT NULL));
    ALTER TABLE public.loan_offers
      ADD CONSTRAINT fk_offer_application_tenant FOREIGN KEY(tenant_id,application_id) REFERENCES public.loan_applications(tenant_id,id),
      ADD CONSTRAINT fk_offer_decision_tenant FOREIGN KEY(tenant_id,decision_id) REFERENCES public.loan_application_decisions(tenant_id,id),
      ADD CONSTRAINT fk_offer_version_tenant FOREIGN KEY(tenant_id,loan_product_version_id) REFERENCES public.loan_product_versions(tenant_id,id);
    CREATE UNIQUE INDEX uq_current_issued_offer ON public.loan_offers(tenant_id,application_id) WHERE status='ISSUED';

    CREATE TABLE public.loan_offer_fee_lines(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, offer_id uuid NOT NULL,
      fee_code varchar(100) NOT NULL, description varchar(255) NOT NULL, amount bigint NOT NULL CHECK(amount>=0),
      treatment varchar(30) NOT NULL CHECK(treatment IN('FINANCED','DEDUCTED_FROM_DISBURSEMENT')),
      calculation_basis jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(tenant_id,id), UNIQUE(tenant_id,offer_id,fee_code),
      FOREIGN KEY(tenant_id,offer_id) REFERENCES public.loan_offers(tenant_id,id)
    );
    CREATE TABLE public.loan_offer_schedules(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, offer_id uuid NOT NULL,
      schedule_version integer NOT NULL DEFAULT 1 CHECK(schedule_version>0), effective_date date NOT NULL,
      maturity_date date NOT NULL, total_principal bigint NOT NULL CHECK(total_principal>0),
      total_interest bigint NOT NULL CHECK(total_interest>=0), total_fees bigint NOT NULL DEFAULT 0 CHECK(total_fees>=0),
      total_amount bigint NOT NULL CHECK(total_amount=total_principal+total_interest+total_fees), currency char(3) NOT NULL DEFAULT 'NGN',
      calculation_version varchar(50) NOT NULL, calculation_input_hash char(64) NOT NULL,
      calculation_output_hash char(64) NOT NULL, rounding_mode varchar(30) NOT NULL,
      day_count_convention varchar(20) NOT NULL, unrounded_total_interest numeric(30,12) NOT NULL,
      rounding_residual bigint NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(),
      retention_until date NOT NULL DEFAULT (current_date + 2557), legal_hold boolean NOT NULL DEFAULT false,
      CHECK(currency='NGN'), CHECK(maturity_date>=effective_date), UNIQUE(tenant_id,id), UNIQUE(tenant_id,offer_id,schedule_version),
      FOREIGN KEY(tenant_id,offer_id) REFERENCES public.loan_offers(tenant_id,id)
    );
    CREATE TABLE public.loan_offer_installments(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, schedule_id uuid NOT NULL,
      installment_number integer NOT NULL CHECK(installment_number>0), period_start date NOT NULL, period_end date NOT NULL,
      due_date date NOT NULL, opening_principal bigint NOT NULL CHECK(opening_principal>=0),
      principal_due bigint NOT NULL CHECK(principal_due>=0), interest_due bigint NOT NULL CHECK(interest_due>=0),
      fees_due bigint NOT NULL DEFAULT 0 CHECK(fees_due>=0), total_due bigint NOT NULL,
      unrounded_interest numeric(30,12) NOT NULL, calculation_hash char(64) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CHECK(period_end>=period_start), CHECK(total_due=principal_due+interest_due+fees_due),
      UNIQUE(tenant_id,id), UNIQUE(tenant_id,schedule_id,installment_number),
      FOREIGN KEY(tenant_id,schedule_id) REFERENCES public.loan_offer_schedules(tenant_id,id)
    );

    CREATE TABLE public.loan_offer_acceptances(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, offer_id uuid NOT NULL,
      customer_id uuid NOT NULL, authorization_reference varchar(255) NOT NULL, authorization_hash char(64) NOT NULL,
      consent_reference varchar(255) NOT NULL, accepted_document_hash char(64) NOT NULL,
      idempotency_key varchar(255) NOT NULL, request_hash char(64) NOT NULL, correlation_id uuid NOT NULL,
      accepted_at timestamptz NOT NULL DEFAULT now(), retention_until date NOT NULL DEFAULT (current_date + 2557),
      legal_hold boolean NOT NULL DEFAULT false, UNIQUE(tenant_id,id), UNIQUE(tenant_id,offer_id),
      UNIQUE(tenant_id,idempotency_key), FOREIGN KEY(tenant_id,offer_id) REFERENCES public.loan_offers(tenant_id,id)
    );

    ALTER TABLE public.loans
      ALTER COLUMN principal_amount TYPE bigint USING round(principal_amount*100)::bigint,
      ALTER COLUMN approved_amount TYPE bigint USING round(approved_amount*100)::bigint,
      ALTER COLUMN disbursed_amount TYPE bigint USING round(disbursed_amount*100)::bigint,
      ALTER COLUMN outstanding_principal TYPE bigint USING round(outstanding_principal*100)::bigint,
      ALTER COLUMN outstanding_interest TYPE bigint USING round(outstanding_interest*100)::bigint,
      ALTER COLUMN outstanding_fees TYPE bigint USING round(outstanding_fees*100)::bigint,
      ALTER COLUMN outstanding_penalties TYPE bigint USING round(outstanding_penalties*100)::bigint,
      ALTER COLUMN total_repaid TYPE bigint USING round(total_repaid*100)::bigint,
      ALTER COLUMN interest_rate TYPE numeric(18,10),
      ADD CONSTRAINT uq_loan_application_tenant UNIQUE(tenant_id,application_id),
      ADD CONSTRAINT fk_loan_offer_tenant FOREIGN KEY(tenant_id,accepted_offer_id) REFERENCES public.loan_offers(tenant_id,id),
      ADD CONSTRAINT fk_loan_version_tenant FOREIGN KEY(tenant_id,loan_product_version_id) REFERENCES public.loan_product_versions(tenant_id,id),
      ADD CONSTRAINT chk_loan_ngn CHECK(currency='NGN');
    ALTER TABLE public.loan_schedules
      ALTER COLUMN total_principal TYPE bigint USING round(total_principal*100)::bigint,
      ALTER COLUMN total_interest TYPE bigint USING round(total_interest*100)::bigint,
      ALTER COLUMN total_fees TYPE bigint USING round(total_fees*100)::bigint,
      ALTER COLUMN total_amount TYPE bigint USING round(total_amount*100)::bigint,
      ADD COLUMN offer_schedule_id uuid, ADD COLUMN calculation_version varchar(50),
      ADD COLUMN calculation_input_hash char(64), ADD COLUMN calculation_output_hash char(64),
      ADD COLUMN rounding_mode varchar(30), ADD COLUMN day_count_convention varchar(20),
      ADD COLUMN unrounded_total_interest numeric(30,12), ADD COLUMN rounding_residual bigint NOT NULL DEFAULT 0,
      ADD CONSTRAINT fk_schedule_offer_schedule_tenant FOREIGN KEY(tenant_id,offer_schedule_id) REFERENCES public.loan_offer_schedules(tenant_id,id);
    ALTER TABLE public.loan_installments
      ALTER COLUMN principal_due TYPE bigint USING round(principal_due*100)::bigint,
      ALTER COLUMN interest_due TYPE bigint USING round(interest_due*100)::bigint,
      ALTER COLUMN fees_due TYPE bigint USING round(fees_due*100)::bigint,
      ALTER COLUMN penalty_due TYPE bigint USING round(penalty_due*100)::bigint,
      ALTER COLUMN total_due TYPE bigint USING round(total_due*100)::bigint,
      ALTER COLUMN principal_paid TYPE bigint USING round(principal_paid*100)::bigint,
      ALTER COLUMN interest_paid TYPE bigint USING round(interest_paid*100)::bigint,
      ALTER COLUMN fees_paid TYPE bigint USING round(fees_paid*100)::bigint,
      ALTER COLUMN penalty_paid TYPE bigint USING round(penalty_paid*100)::bigint,
      ALTER COLUMN total_paid TYPE bigint USING round(total_paid*100)::bigint,
      ADD COLUMN period_start date, ADD COLUMN period_end date, ADD COLUMN opening_principal bigint,
      ADD COLUMN unrounded_interest numeric(30,12), ADD COLUMN calculation_hash char(64);

    ALTER TABLE public.loan_contracts
      ALTER COLUMN document_hash TYPE char(64), ADD COLUMN acceptance_id uuid,
      ADD COLUMN authorization_reference varchar(255), ADD COLUMN authorization_hash char(64),
      ADD COLUMN consent_reference varchar(255), ADD COLUMN accepted_document_hash char(64),
      ADD COLUMN idempotency_key varchar(255), ADD COLUMN request_hash char(64), ADD COLUMN correlation_id uuid,
      ADD COLUMN retention_until date NOT NULL DEFAULT (current_date + 2557), ADD COLUMN legal_hold boolean NOT NULL DEFAULT false,
      ADD CONSTRAINT uq_contract_tenant_id UNIQUE(tenant_id,id), ADD CONSTRAINT uq_contract_idempotency UNIQUE(tenant_id,idempotency_key),
      ADD CONSTRAINT fk_contract_acceptance_tenant FOREIGN KEY(tenant_id,acceptance_id) REFERENCES public.loan_offer_acceptances(tenant_id,id),
      ADD CONSTRAINT fk_contract_loan_tenant FOREIGN KEY(tenant_id,loan_id) REFERENCES public.loans(tenant_id,id),
      ADD CONSTRAINT fk_contract_offer_tenant FOREIGN KEY(tenant_id,offer_id) REFERENCES public.loan_offers(tenant_id,id);

    CREATE OR REPLACE FUNCTION public.protect_issued_offer() RETURNS trigger LANGUAGE plpgsql AS $$
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
    CREATE TRIGGER trg_protect_issued_offer BEFORE UPDATE OR DELETE ON public.loan_offers FOR EACH ROW EXECUTE FUNCTION public.protect_issued_offer();
    CREATE OR REPLACE FUNCTION public.protect_offer_calculation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Offer calculation evidence is immutable'; END $$;
    CREATE TRIGGER trg_protect_offer_schedule BEFORE UPDATE OR DELETE ON public.loan_offer_schedules FOR EACH ROW EXECUTE FUNCTION public.protect_offer_calculation();
    CREATE TRIGGER trg_protect_offer_installment BEFORE UPDATE OR DELETE ON public.loan_offer_installments FOR EACH ROW EXECUTE FUNCTION public.protect_offer_calculation();
    CREATE TRIGGER trg_protect_offer_fee BEFORE UPDATE OR DELETE ON public.loan_offer_fee_lines FOR EACH ROW EXECUTE FUNCTION public.protect_offer_calculation();
    CREATE TRIGGER trg_protect_offer_acceptance BEFORE UPDATE OR DELETE ON public.loan_offer_acceptances FOR EACH ROW EXECUTE FUNCTION public.protect_offer_calculation();
    CREATE OR REPLACE FUNCTION public.protect_signed_contract() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF TG_OP='DELETE' OR OLD.status IN('SIGNED','ACTIVE','TERMINATED','COMPLETED','VOIDED') THEN RAISE EXCEPTION 'Signed contract is immutable'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER trg_protect_signed_contract BEFORE UPDATE OR DELETE ON public.loan_contracts FOR EACH ROW EXECUTE FUNCTION public.protect_signed_contract();

    ALTER TABLE public.loan_offer_fee_lines ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_offer_fee_lines FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_offer_schedules ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_offer_schedules FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_offer_installments ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_offer_installments FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_offer_acceptances ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_offer_acceptances FORCE ROW LEVEL SECURITY;
    CREATE POLICY offer_fee_tenant_policy ON public.loan_offer_fee_lines USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    CREATE POLICY offer_schedule_tenant_policy ON public.loan_offer_schedules USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    CREATE POLICY offer_installment_tenant_policy ON public.loan_offer_installments USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    CREATE POLICY offer_acceptance_tenant_policy ON public.loan_offer_acceptances USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    GRANT SELECT,INSERT ON public.loan_offer_fee_lines,public.loan_offer_schedules,public.loan_offer_installments,public.loan_offer_acceptances TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_offer_fee_lines,public.loan_offer_schedules,public.loan_offer_installments,public.loan_offer_acceptances TO parc_lending_readonly;
  `);
}

export function down(): Promise<never> {
  return Promise.reject(
    new Error("LN-04 offer and contract controls are forward-only"),
  );
}

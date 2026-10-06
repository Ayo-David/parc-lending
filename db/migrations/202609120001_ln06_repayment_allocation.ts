import type { Knex } from "knex";

export const config = { transaction: false };

/** Approved LENDING-DB-73 through LENDING-DB-88. */
export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("loan_repayment_allocation_batches")) return;
  await knex.raw(`
    ALTER TABLE public.loan_repayments
      ALTER COLUMN amount TYPE bigint USING round(amount*100)::bigint,
      ALTER COLUMN status TYPE varchar(30) USING status::text,
      ADD COLUMN idempotency_key varchar(255), ADD COLUMN request_hash char(64),
      ADD COLUMN correlation_id uuid, ADD COLUMN causation_id uuid,
      ADD COLUMN source_event_id uuid, ADD COLUMN source_event_type varchar(150),
      ADD COLUMN source_payload_hash char(64), ADD COLUMN allocation_policy_hash char(64),
      ADD COLUMN ledger_idempotency_key varchar(255), ADD COLUMN version integer NOT NULL DEFAULT 0,
      ADD COLUMN retention_until date NOT NULL DEFAULT(current_date+2557),
      ADD COLUMN legal_hold boolean NOT NULL DEFAULT false,
      ADD CONSTRAINT uq_repayment_idempotency UNIQUE(tenant_id,idempotency_key),
      ADD CONSTRAINT uq_repayment_payment UNIQUE(tenant_id,payment_transaction_id),
      ADD CONSTRAINT uq_repayment_source_event UNIQUE(tenant_id,source_event_id),
      ADD CONSTRAINT chk_repayment_source_evidence CHECK(source_event_id IS NOT NULL AND source_event_type IS NOT NULL AND source_payload_hash IS NOT NULL AND correlation_id IS NOT NULL AND causation_id IS NOT NULL),
      ADD CONSTRAINT chk_repayment_ngn CHECK(currency='NGN'),
      ADD CONSTRAINT chk_repayment_state CHECK(status IN('PENDING','PROCESSING','LEDGER_POSTING','SUCCESSFUL','FAILED','REVERSED','REFUNDED','MANUAL_REVIEW'));
    ALTER TABLE public.loan_repayment_attempts
      ALTER COLUMN amount TYPE bigint USING round(amount*100)::bigint,
      ADD CONSTRAINT uq_repayment_attempt_tenant UNIQUE(tenant_id,id),
      ADD CONSTRAINT fk_repayment_attempt_loan_tenant FOREIGN KEY(tenant_id,loan_id) REFERENCES public.loans(tenant_id,id),
      ADD CONSTRAINT fk_repayment_attempt_repayment_tenant FOREIGN KEY(tenant_id,repayment_id) REFERENCES public.loan_repayments(tenant_id,id);
    ALTER TABLE public.loan_repayment_allocations
      ALTER COLUMN principal_amount TYPE bigint USING round(principal_amount*100)::bigint,
      ALTER COLUMN interest_amount TYPE bigint USING round(interest_amount*100)::bigint,
      ALTER COLUMN fee_amount TYPE bigint USING round(fee_amount*100)::bigint,
      ALTER COLUMN penalty_amount TYPE bigint USING round(penalty_amount*100)::bigint,
      ALTER COLUMN total_amount TYPE bigint USING round(total_amount*100)::bigint,
      ADD CONSTRAINT uq_repayment_allocation_tenant UNIQUE(tenant_id,id);

    CREATE TABLE public.loan_repayment_allocation_batches(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, repayment_id uuid NOT NULL,
      loan_id uuid NOT NULL, product_version_id uuid NOT NULL, status varchar(30) NOT NULL,
      amount bigint NOT NULL CHECK(amount>0), allocated_amount bigint NOT NULL DEFAULT 0 CHECK(allocated_amount>=0),
      unapplied_amount bigint NOT NULL DEFAULT 0 CHECK(unapplied_amount>=0), currency char(3) NOT NULL DEFAULT 'NGN',
      allocation_order jsonb NOT NULL, policy_hash char(64) NOT NULL, input_hash char(64) NOT NULL,
      output_hash char(64) NOT NULL, ledger_idempotency_key varchar(255) NOT NULL,
      ledger_transaction_id uuid, version integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(), applied_at timestamptz,
      retention_until date NOT NULL DEFAULT(current_date+2557), legal_hold boolean NOT NULL DEFAULT false,
      CHECK(currency='NGN'), CHECK(public.valid_allocation_order(allocation_order)),
      CHECK(amount=allocated_amount+unapplied_amount),
      CHECK(status IN('PREPARED','LEDGER_POSTING','APPLIED','FAILED','MANUAL_REVIEW','REVERSED')),
      CHECK(status NOT IN('APPLIED','REVERSED') OR ledger_transaction_id IS NOT NULL),
      UNIQUE(tenant_id,id), UNIQUE(tenant_id,repayment_id), UNIQUE(tenant_id,ledger_idempotency_key),
      FOREIGN KEY(tenant_id,repayment_id) REFERENCES public.loan_repayments(tenant_id,id),
      FOREIGN KEY(tenant_id,loan_id) REFERENCES public.loans(tenant_id,id),
      FOREIGN KEY(tenant_id,product_version_id) REFERENCES public.loan_product_versions(tenant_id,id)
    );
    CREATE TABLE public.loan_repayment_allocation_lines(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, batch_id uuid NOT NULL,
      installment_id uuid NOT NULL, sequence_number integer NOT NULL CHECK(sequence_number>0),
      component varchar(20) NOT NULL CHECK(component IN('PENALTY','FEES','INTEREST','PRINCIPAL')),
      amount bigint NOT NULL CHECK(amount>0), created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(tenant_id,id), UNIQUE(tenant_id,batch_id,sequence_number), UNIQUE(tenant_id,batch_id,installment_id,component),
      FOREIGN KEY(tenant_id,batch_id) REFERENCES public.loan_repayment_allocation_batches(tenant_id,id),
      FOREIGN KEY(tenant_id,installment_id) REFERENCES public.loan_installments(tenant_id,id)
    );
    CREATE TABLE public.loan_unapplied_credits(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, repayment_id uuid NOT NULL,
      loan_id uuid NOT NULL, amount bigint NOT NULL CHECK(amount>0), currency char(3) NOT NULL DEFAULT 'NGN',
      ledger_account_id uuid NOT NULL, ledger_transaction_id uuid NOT NULL, status varchar(20) NOT NULL DEFAULT 'AVAILABLE',
      created_at timestamptz NOT NULL DEFAULT now(), retention_until date NOT NULL DEFAULT(current_date+2557),
      legal_hold boolean NOT NULL DEFAULT false, CHECK(currency='NGN'), CHECK(status IN('AVAILABLE','APPLIED','REFUNDED')),
      UNIQUE(tenant_id,id), UNIQUE(tenant_id,repayment_id),
      FOREIGN KEY(tenant_id,repayment_id) REFERENCES public.loan_repayments(tenant_id,id),
      FOREIGN KEY(tenant_id,loan_id) REFERENCES public.loans(tenant_id,id)
    );
    CREATE TABLE public.loan_repayment_reversals(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, repayment_id uuid NOT NULL,
      allocation_batch_id uuid NOT NULL, reversal_of_id uuid, reason varchar(500) NOT NULL,
      authority_type varchar(30) NOT NULL CHECK(authority_type IN('APPROVAL','AUTOMATED_RULE')),
      authority_id uuid NOT NULL, authority_payload_hash char(64) NOT NULL, ledger_transaction_id uuid,
      status varchar(20) NOT NULL CHECK(status IN('PENDING','POSTED','FAILED')),
      created_at timestamptz NOT NULL DEFAULT now(), posted_at timestamptz,
      retention_until date NOT NULL DEFAULT(current_date+2557), legal_hold boolean NOT NULL DEFAULT false,
      UNIQUE(tenant_id,id), UNIQUE(tenant_id,repayment_id),
      FOREIGN KEY(tenant_id,repayment_id) REFERENCES public.loan_repayments(tenant_id,id),
      FOREIGN KEY(tenant_id,allocation_batch_id) REFERENCES public.loan_repayment_allocation_batches(tenant_id,id),
      FOREIGN KEY(tenant_id,reversal_of_id) REFERENCES public.loan_repayment_reversals(tenant_id,id)
    );
    CREATE TABLE public.loan_repayment_lifecycle_history(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, repayment_id uuid NOT NULL,
      previous_status varchar(30), new_status varchar(30) NOT NULL, reason_code varchar(100),
      correlation_id uuid, created_at timestamptz NOT NULL DEFAULT now(),
      FOREIGN KEY(tenant_id,repayment_id) REFERENCES public.loan_repayments(tenant_id,id)
    );

    CREATE OR REPLACE FUNCTION public.protect_final_repayment_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF TG_OP='DELETE' OR OLD.status IN('SUCCESSFUL','REVERSED','REFUNDED') THEN RAISE EXCEPTION 'Final repayment evidence is immutable'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER trg_protect_final_repayment BEFORE UPDATE OR DELETE ON public.loan_repayments FOR EACH ROW EXECUTE FUNCTION public.protect_final_repayment_evidence();
    CREATE OR REPLACE FUNCTION public.protect_repayment_allocation_evidence() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Repayment allocation evidence is immutable'; END $$;
    CREATE TRIGGER trg_protect_repayment_lines BEFORE UPDATE OR DELETE ON public.loan_repayment_allocation_lines FOR EACH ROW EXECUTE FUNCTION public.protect_repayment_allocation_evidence();
    CREATE TRIGGER trg_protect_legacy_repayment_allocations BEFORE UPDATE OR DELETE ON public.loan_repayment_allocations FOR EACH ROW EXECUTE FUNCTION public.protect_repayment_allocation_evidence();
    CREATE TRIGGER trg_protect_repayment_history BEFORE UPDATE OR DELETE ON public.loan_repayment_lifecycle_history FOR EACH ROW EXECUTE FUNCTION public.protect_repayment_allocation_evidence();
    CREATE OR REPLACE FUNCTION public.protect_final_repayment_batch() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF TG_OP='DELETE' OR OLD.status IN('APPLIED','REVERSED') THEN RAISE EXCEPTION 'Final repayment allocation batch is immutable'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER trg_protect_final_repayment_batch BEFORE UPDATE OR DELETE ON public.loan_repayment_allocation_batches FOR EACH ROW EXECUTE FUNCTION public.protect_final_repayment_batch();
    CREATE OR REPLACE FUNCTION public.protect_final_repayment_reversal() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF TG_OP='DELETE' OR OLD.status IN('POSTED','FAILED') THEN RAISE EXCEPTION 'Final repayment reversal evidence is immutable'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER trg_protect_final_repayment_reversal BEFORE UPDATE OR DELETE ON public.loan_repayment_reversals FOR EACH ROW EXECUTE FUNCTION public.protect_final_repayment_reversal();
    CREATE OR REPLACE FUNCTION public.validate_installment_balances() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
      IF NEW.principal_paid>NEW.principal_due OR NEW.interest_paid>NEW.interest_due OR NEW.fees_paid>NEW.fees_due OR NEW.penalty_paid>NEW.penalty_due OR NEW.total_paid>NEW.total_due THEN RAISE EXCEPTION 'Installment paid amount exceeds amount due'; END IF;
      IF NEW.total_paid=NEW.total_due THEN NEW.status='PAID'; NEW.paid_at=COALESCE(NEW.paid_at,now());
      ELSIF NEW.total_paid>0 THEN NEW.status='PARTIALLY_PAID'; NEW.paid_at=NULL; END IF; RETURN NEW; END $$;
    CREATE TRIGGER trg_validate_installment_balances BEFORE UPDATE OF principal_paid,interest_paid,fees_paid,penalty_paid,total_paid ON public.loan_installments FOR EACH ROW EXECUTE FUNCTION public.validate_installment_balances();

    CREATE INDEX idx_repayment_recovery ON public.loan_repayments(status,created_at) WHERE status IN('PROCESSING','LEDGER_POSTING','MANUAL_REVIEW');
    CREATE INDEX idx_repayment_lines_batch ON public.loan_repayment_allocation_lines(tenant_id,batch_id,sequence_number);
    CREATE INDEX idx_unapplied_credit_customer ON public.loan_unapplied_credits(tenant_id,loan_id,status);
    ALTER TABLE public.loan_repayment_allocation_batches ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_repayment_allocation_batches FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_repayment_allocation_lines ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_repayment_allocation_lines FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_unapplied_credits ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_unapplied_credits FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_repayment_reversals ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_repayment_reversals FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_repayment_lifecycle_history ENABLE ROW LEVEL SECURITY; ALTER TABLE public.loan_repayment_lifecycle_history FORCE ROW LEVEL SECURITY;
    CREATE POLICY repayment_batch_tenant_policy ON public.loan_repayment_allocation_batches USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    CREATE POLICY repayment_line_tenant_policy ON public.loan_repayment_allocation_lines USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    CREATE POLICY unapplied_credit_tenant_policy ON public.loan_unapplied_credits USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    CREATE POLICY repayment_reversal_tenant_policy ON public.loan_repayment_reversals USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    CREATE POLICY repayment_history_tenant_policy ON public.loan_repayment_lifecycle_history USING(tenant_id=public.current_tenant_uuid()) WITH CHECK(tenant_id=public.current_tenant_uuid());
    GRANT SELECT,INSERT,UPDATE ON public.loan_repayment_allocation_batches,public.loan_unapplied_credits,public.loan_repayment_reversals TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT,INSERT ON public.loan_repayment_allocation_lines,public.loan_repayment_lifecycle_history TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_repayment_allocation_batches,public.loan_repayment_allocation_lines,public.loan_unapplied_credits,public.loan_repayment_reversals,public.loan_repayment_lifecycle_history TO parc_lending_readonly;
  `);
}

export function down(): Promise<never> {
  return Promise.reject(
    new Error("LN-06 repayment allocation is forward-only"),
  );
}

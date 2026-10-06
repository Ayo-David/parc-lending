import type { Knex } from "knex";

export const config = { transaction: false };

/** Approved LENDING-DB-130 lifecycle enforcement. */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION public.validate_repayment_request_transition() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.status IS DISTINCT FROM OLD.status AND NOT(
        (OLD.status='SUBMITTING' AND NEW.status IN('PENDING_COLLECTION','PENDING_MATCH','FAILED','MANUAL_REVIEW')) OR
        (OLD.status IN('PENDING_COLLECTION','PENDING_MATCH') AND NEW.status IN('CONFIRMED','FAILED','MANUAL_REVIEW'))
      ) THEN RAISE EXCEPTION 'Invalid repayment request transition'; END IF;
      IF NEW.status IN('PENDING_COLLECTION','PENDING_MATCH','CONFIRMED') AND NEW.payment_request_id IS NULL
      THEN RAISE EXCEPTION 'Payment request evidence is required'; END IF; RETURN NEW; END $$;
    DROP TRIGGER IF EXISTS trg_validate_repayment_request_transition ON public.loan_repayment_requests;
    CREATE TRIGGER trg_validate_repayment_request_transition BEFORE UPDATE ON public.loan_repayment_requests
      FOR EACH ROW EXECUTE FUNCTION public.validate_repayment_request_transition();
  `);
}

export function down(): Promise<never> {
  return Promise.reject(new Error("LENDING-DB-130 is forward-only"));
}

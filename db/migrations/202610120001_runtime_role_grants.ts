import type { Knex } from "knex";

// The baseline snapshot carries no privileges, and on a database built from it
// LN-01/02/03/04/05/06/07/08, the command-idempotency and the customer-quote
// migrations return early because their tables already exist, so their grants
// never run and the application login cannot read any table. Restate them:
// LN-01's blanket grant covered every table that existed before the later
// migrations, so apply it to all tables except those the later migrations
// create, then repeat each later migration's narrower grant verbatim.
// Grants only: DELETE stays ungranted, the migration bookkeeping tables stay
// private, and RLS still applies because no lending role may bypass it.
// Every statement is idempotent.
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DO $guard$ BEGIN
      IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname IN('parc_lending_runtime','parc_lending_worker','parc_lending_readonly') AND (rolsuper OR rolbypassrls)) THEN
        RAISE EXCEPTION 'Lending roles must not bypass row level security';
      END IF;
    END $guard$;
    GRANT USAGE ON SCHEMA public TO parc_lending_runtime,parc_lending_worker,parc_lending_readonly;
    DO $grants$ DECLARE r record; BEGIN
      FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind IN('r','p') AND c.relname NOT LIKE 'knex\\_migrations%'
          AND c.relname NOT IN(
            'loan_automated_evaluations','loan_automated_rule_results',
            'loan_manual_review_cases','loan_manual_review_recommendations','loan_manual_decision_conditions',
            'loan_offer_fee_lines','loan_offer_schedules','loan_offer_installments','loan_offer_acceptances',
            'loan_disbursement_saga_steps',
            'loan_repayment_allocation_batches','loan_repayment_allocation_lines','loan_unapplied_credits','loan_repayment_reversals','loan_repayment_lifecycle_history',
            'loan_servicing_runs','loan_penalty_assessments','loan_delinquency_assessments',
            'loan_restructure_history','loan_writeoff_history',
            'loan_manual_review_assignments',
            'loan_quotes','loan_repayment_quotes','loan_repayment_requests',
            'loan_underwriting_evidence_snapshots','loan_underwriting_evidence_sources')
      LOOP
        EXECUTE format('GRANT SELECT,INSERT,UPDATE ON public.%I TO parc_lending_runtime,parc_lending_worker',r.relname);
        EXECUTE format('GRANT SELECT ON public.%I TO parc_lending_readonly',r.relname);
      END LOOP;
      FOR r IN SELECT sequencename FROM pg_sequences WHERE schemaname='public' AND sequencename NOT LIKE 'knex\\_migrations%' LOOP
        EXECUTE format('GRANT USAGE,SELECT ON SEQUENCE public.%I TO parc_lending_runtime,parc_lending_worker',r.sequencename);
      END LOOP;
    END $grants$;
    GRANT SELECT,INSERT,UPDATE ON public.loan_automated_evaluations TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT,INSERT ON public.loan_automated_rule_results TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT,INSERT,UPDATE ON public.loan_manual_review_cases TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT,INSERT ON public.loan_manual_review_recommendations TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT,INSERT,UPDATE ON public.loan_manual_decision_conditions TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_manual_review_cases,public.loan_manual_review_recommendations,public.loan_manual_decision_conditions TO parc_lending_readonly;
    GRANT SELECT,INSERT ON public.loan_offer_fee_lines,public.loan_offer_schedules,public.loan_offer_installments,public.loan_offer_acceptances TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_offer_fee_lines,public.loan_offer_schedules,public.loan_offer_installments,public.loan_offer_acceptances TO parc_lending_readonly;
    GRANT SELECT,INSERT,UPDATE ON public.loan_disbursement_saga_steps TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_disbursement_saga_steps TO parc_lending_readonly;
    GRANT SELECT,INSERT,UPDATE ON public.loan_repayment_allocation_batches,public.loan_unapplied_credits,public.loan_repayment_reversals TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT,INSERT ON public.loan_repayment_allocation_lines,public.loan_repayment_lifecycle_history TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_repayment_allocation_batches,public.loan_repayment_allocation_lines,public.loan_unapplied_credits,public.loan_repayment_reversals,public.loan_repayment_lifecycle_history TO parc_lending_readonly;
    GRANT SELECT,INSERT,UPDATE ON public.loan_servicing_runs,public.loan_penalty_assessments TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT,INSERT ON public.loan_delinquency_assessments TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_servicing_runs,public.loan_penalty_assessments,public.loan_delinquency_assessments TO parc_lending_readonly;
    GRANT SELECT,INSERT ON public.loan_restructure_history,public.loan_writeoff_history TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_restructure_history,public.loan_writeoff_history TO parc_lending_readonly;
    GRANT SELECT,INSERT ON public.loan_manual_review_assignments TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_manual_review_assignments TO parc_lending_readonly;
    GRANT SELECT,INSERT ON public.loan_quotes,public.loan_repayment_quotes TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT,INSERT,UPDATE ON public.loan_repayment_requests TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_quotes,public.loan_repayment_quotes,public.loan_repayment_requests TO parc_lending_readonly;
    GRANT SELECT,INSERT,UPDATE ON public.loan_underwriting_evidence_snapshots TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT,INSERT ON public.loan_underwriting_evidence_sources TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_underwriting_evidence_snapshots,public.loan_underwriting_evidence_sources TO parc_lending_readonly;
  `);
}

export function down(): Promise<never> {
  return Promise.reject(new Error("Lending role grants are forward-only"));
}

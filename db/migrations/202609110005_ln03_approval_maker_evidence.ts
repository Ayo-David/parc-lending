import type { Knex } from "knex";

export const config = { transaction: false };

/** Completes approved LENDING-DB-35 through LENDING-DB-37 evidence binding. */
export async function up(knex: Knex): Promise<void> {
  if (
    await knex.schema.hasColumn(
      "loan_application_decisions",
      "approval_maker_id",
    )
  )
    return;
  await knex.raw(`
    ALTER TABLE public.loan_application_decisions DROP CONSTRAINT chk_manual_decision_approval;
    ALTER TABLE public.loan_application_decisions ADD COLUMN approval_maker_id uuid;
    ALTER TABLE public.loan_application_decisions ADD CONSTRAINT chk_manual_decision_approval CHECK(decision_source<>'MANUAL' OR
      (review_case_id IS NOT NULL AND recommendation_id IS NOT NULL AND approval_id IS NOT NULL
       AND approval_action='MANUAL_LOAN_APPROVAL' AND approval_resource_type='loan_manual_review_case'
       AND approval_resource_id=review_case_id AND approval_payload_hash IS NOT NULL
       AND approval_consumed_at IS NOT NULL AND approval_maker_id IS NOT NULL
       AND jsonb_array_length(approval_checker_ids)>0 AND required_authority_level>0
       AND approved_authority_level>=required_authority_level AND idempotency_key IS NOT NULL
       AND correlation_id IS NOT NULL));
    CREATE OR REPLACE FUNCTION public.validate_manual_decision_separation() RETURNS trigger LANGUAGE plpgsql AS $$
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
  `);
}

export function down(): Promise<never> {
  return Promise.reject(new Error("LN-03 approval evidence is forward-only"));
}

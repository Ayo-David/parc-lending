import type { Knex } from "knex";

export const config = { transaction: false };

/** Approved LENDING-DB-123/124: narrowly permit evidenced reversal transitions. */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION public.protect_final_repayment_batch() RETURNS trigger LANGUAGE plpgsql AS $$
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

    CREATE OR REPLACE FUNCTION public.protect_final_repayment_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
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
  `);
}

export function down(): Promise<never> {
  return Promise.reject(new Error("LENDING-DB-123 is forward-only"));
}

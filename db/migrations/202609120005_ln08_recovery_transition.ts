import type { Knex } from "knex";

export const config = { transaction: false };

/** Approved LENDING-DB-125: permit only an exactly evidenced recovery increment. */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION public.protect_completed_writeoff() RETURNS trigger LANGUAGE plpgsql AS $$
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
  `);
}

export function down(): Promise<never> {
  return Promise.reject(new Error("LENDING-DB-125 is forward-only"));
}

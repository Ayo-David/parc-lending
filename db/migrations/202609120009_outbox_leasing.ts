import type { Knex } from "knex";

export const config = { transaction: false };

/** Approved LENDING-DB-131. */
export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn("loan_outbox_events", "lease_owner")) return;
  await knex.raw(`
    ALTER TABLE public.loan_outbox_events
      ADD COLUMN aggregate_version integer NOT NULL DEFAULT 1 CHECK(aggregate_version>0),
      ADD COLUMN causation_id uuid,
      ADD COLUMN data_classification varchar(20) NOT NULL DEFAULT 'CONFIDENTIAL'
        CHECK(data_classification IN('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED')),
      ADD COLUMN lease_owner varchar(150),
      ADD COLUMN lease_expires_at timestamptz,
      DROP CONSTRAINT chk_loan_outbox_status,
      ADD CONSTRAINT chk_loan_outbox_status
        CHECK(status IN('PENDING','PROCESSING','PUBLISHED','FAILED')),
      ADD CONSTRAINT chk_loan_outbox_lease CHECK(
        (status='PROCESSING' AND lease_owner IS NOT NULL AND lease_expires_at IS NOT NULL) OR
        (status<>'PROCESSING' AND lease_owner IS NULL AND lease_expires_at IS NULL)
      );
    CREATE INDEX idx_loan_outbox_claim ON public.loan_outbox_events(available_at,created_at)
      WHERE status IN('PENDING','FAILED');
    CREATE INDEX idx_loan_outbox_expired_lease ON public.loan_outbox_events(lease_expires_at)
      WHERE status='PROCESSING';
  `);
}

export function down(): Promise<never> {
  return Promise.reject(new Error("LENDING-DB-131 is forward-only"));
}

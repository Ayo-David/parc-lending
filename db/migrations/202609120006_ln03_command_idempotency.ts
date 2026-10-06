import type { Knex } from "knex";

export const config = { transaction: false };

/** Approved LENDING-DB-126 and LENDING-DB-127. */
export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("loan_manual_review_assignments")) return;
  await knex.raw(`
    ALTER TABLE public.loan_manual_review_cases
      ADD COLUMN opening_idempotency_key varchar(255),
      ADD COLUMN opening_request_hash char(64),
      ADD CONSTRAINT chk_manual_case_opening_idempotency CHECK(
        (opening_idempotency_key IS NULL)=(opening_request_hash IS NULL)
      );
    CREATE UNIQUE INDEX uq_manual_case_opening_idempotency
      ON public.loan_manual_review_cases(tenant_id,opening_idempotency_key)
      WHERE opening_idempotency_key IS NOT NULL;

    CREATE TABLE public.loan_manual_review_assignments(
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      review_case_id uuid NOT NULL,
      reviewer_id uuid NOT NULL,
      expected_lock_version integer NOT NULL CHECK(expected_lock_version>=0),
      resulting_lock_version integer NOT NULL CHECK(resulting_lock_version=expected_lock_version+1),
      lease_expires_at timestamptz NOT NULL,
      idempotency_key varchar(255) NOT NULL,
      request_hash char(64) NOT NULL,
      assigned_at timestamptz NOT NULL DEFAULT now(),
      retention_until date NOT NULL DEFAULT (current_date + 2557),
      legal_hold boolean NOT NULL DEFAULT false,
      UNIQUE(tenant_id,id),
      UNIQUE(tenant_id,idempotency_key),
      FOREIGN KEY(tenant_id,review_case_id)
        REFERENCES public.loan_manual_review_cases(tenant_id,id)
    );
    CREATE INDEX idx_manual_assignment_case
      ON public.loan_manual_review_assignments(tenant_id,review_case_id,assigned_at DESC);

    CREATE TRIGGER trg_protect_manual_assignment
      BEFORE UPDATE OR DELETE ON public.loan_manual_review_assignments
      FOR EACH ROW EXECUTE FUNCTION public.protect_manual_underwriting_evidence();

    ALTER TABLE public.loan_manual_review_assignments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.loan_manual_review_assignments FORCE ROW LEVEL SECURITY;
    CREATE POLICY manual_assignment_tenant_policy ON public.loan_manual_review_assignments
      USING(tenant_id=public.current_tenant_uuid())
      WITH CHECK(tenant_id=public.current_tenant_uuid());
    GRANT SELECT,INSERT ON public.loan_manual_review_assignments
      TO parc_lending_runtime,parc_lending_worker;
    GRANT SELECT ON public.loan_manual_review_assignments TO parc_lending_readonly;
  `);
}

export function down(): Promise<never> {
  return Promise.reject(
    new Error("LENDING-DB-126 and LENDING-DB-127 are forward-only"),
  );
}

import type { Knex } from "knex";
import type { LendingEligibilityGateway } from "../../src/services/loan-application-service.js";

/** Auth eligibility that yields a READY underwriting snapshot on submission. */
export const readyEligibility: LendingEligibilityGateway = {
  getLendingEligibility: () =>
    Promise.resolve({
      kyc: {
        tier: "TIER_2",
        status: "VERIFIED",
        verification_reference: "kyc-ref",
        observed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
      risk: { disposition: "CLEAR", assessment_reference: "risk-ref" },
      consent: { valid: true },
    }),
};

/** Removes immutable underwriting evidence so applications can be deleted. */
export async function deleteUnderwritingEvidence(
  db: Knex,
  tenantId: string,
): Promise<void> {
  await db("loan_applications")
    .where({ tenant_id: tenantId })
    .update({ latest_underwriting_snapshot_id: null });
  await db.raw(
    "ALTER TABLE public.loan_underwriting_evidence_sources DISABLE TRIGGER trg_protect_underwriting_source",
  );
  await db.raw(
    "ALTER TABLE public.loan_underwriting_evidence_snapshots DISABLE TRIGGER trg_protect_underwriting_snapshot",
  );
  await db("loan_underwriting_evidence_sources")
    .where({ tenant_id: tenantId })
    .delete();
  await db("loan_underwriting_evidence_snapshots")
    .where({ tenant_id: tenantId })
    .delete();
  await db.raw(
    "ALTER TABLE public.loan_underwriting_evidence_snapshots ENABLE TRIGGER trg_protect_underwriting_snapshot",
  );
  await db.raw(
    "ALTER TABLE public.loan_underwriting_evidence_sources ENABLE TRIGGER trg_protect_underwriting_source",
  );
}

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Knex } from "knex";
const snapshotUrl = new URL("../schema/current.sql", import.meta.url);
const approvedExistingBaselineHash =
  "4e82fe32278b7d969e0690ecaa133f1561b4be21c7be8ad6d5fb9242358bcce4";
const canonicalSnapshotHash =
  "df49e06b72e3c1e4df911665819631373eede415202e4d49af284346b1f5af55";
export const config = { transaction: false };
export async function up(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable("loan_products")) {
    if (
      process.env.APPROVED_EXISTING_BASELINE_SHA256 !==
      approvedExistingBaselineHash
    )
      throw new Error(
        "Existing Lending schema requires the explicitly approved baseline SHA-256",
      );
    return;
  }
  const sql = await readFile(fileURLToPath(snapshotUrl), "utf8");
  const hash = createHash("sha256").update(sql).digest("hex");
  if (hash !== canonicalSnapshotHash)
    throw new Error(`Lending schema snapshot hash mismatch: ${hash}`);
  await knex.raw(sql);
  await knex.raw("SET search_path TO public");
}
export function down(): Promise<never> {
  return Promise.reject(new Error("Lending baseline is forward-only"));
}

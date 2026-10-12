import { randomUUID } from "node:crypto";
import knex, { type Knex } from "knex";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

// Append-only tables the later migrations granted without UPDATE. Other
// integration suites connect as the schema owner, so they cannot catch a
// missing grant for the runtime login.
const insertOnly = [
  "loan_automated_rule_results",
  "loan_manual_review_recommendations",
  "loan_offer_fee_lines",
  "loan_offer_schedules",
  "loan_offer_installments",
  "loan_offer_acceptances",
  "loan_repayment_allocation_lines",
  "loan_repayment_lifecycle_history",
  "loan_delinquency_assessments",
  "loan_restructure_history",
  "loan_writeoff_history",
  "loan_manual_review_assignments",
  "loan_quotes",
  "loan_repayment_quotes",
  "loan_underwriting_evidence_sources",
];

// LN-02 never granted readonly on its automated underwriting tables.
const hiddenFromReadonly = [
  "loan_automated_evaluations",
  "loan_automated_rule_results",
];

const privilegeRows = async (
  db: Knex,
  role: string,
  privilege: string,
): Promise<string[]> => {
  const { rows } = await db.raw<{ rows: { relname: string }[] }>(
    `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind IN('r','p') AND c.relname NOT LIKE 'knex\\_migrations%'
        AND has_table_privilege(?, c.oid, ?) ORDER BY 1`,
    [role, privilege],
  );
  return rows.map((row) => row.relname);
};

const allTables = async (db: Knex): Promise<string[]> => {
  const { rows } = await db.raw<{ rows: { relname: string }[] }>(
    `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind IN('r','p') AND c.relname NOT LIKE 'knex\\_migrations%' ORDER BY 1`,
  );
  return rows.map((row) => row.relname);
};

describeDatabase("lending runtime role grants", () => {
  let db: Knex;
  beforeAll(() => {
    db = knex({ client: "pg", connection: databaseUrl! });
  });
  afterAll(async () => {
    await db.destroy();
  });

  it("lets the service roles read every lending table", async () => {
    const tables = await allTables(db);
    expect(tables).toEqual(
      expect.arrayContaining([
        "loans",
        "loan_applications",
        "loan_product_versions",
      ]),
    );
    for (const role of ["parc_lending_runtime", "parc_lending_worker"])
      expect(await privilegeRows(db, role, "SELECT")).toEqual(tables);
    expect(await privilegeRows(db, "parc_lending_readonly", "SELECT")).toEqual(
      tables.filter((table) => !hiddenFromReadonly.includes(table)),
    );
  });

  it("grants INSERT and UPDATE to the service roles, never DELETE or writes to readonly", async () => {
    const tables = await allTables(db);
    for (const role of ["parc_lending_runtime", "parc_lending_worker"]) {
      expect(await privilegeRows(db, role, "INSERT")).toEqual(tables);
      expect(await privilegeRows(db, role, "UPDATE")).toEqual(
        tables.filter((table) => !insertOnly.includes(table)),
      );
      expect(await privilegeRows(db, role, "DELETE")).toEqual([]);
    }
    for (const privilege of ["INSERT", "UPDATE", "DELETE"])
      expect(
        await privilegeRows(db, "parc_lending_readonly", privilege),
      ).toEqual([]);
  });

  it("keeps the migration bookkeeping tables private", async () => {
    const { rows } = await db.raw<{ rows: { granted: boolean }[] }>(
      "SELECT has_table_privilege('parc_lending_runtime','public.knex_migrations','SELECT') AS granted",
    );
    expect(rows[0]!.granted).toBe(false);
  });

  it("keeps every tenant table under forced RLS", async () => {
    const { rows } = await db.raw<{ rows: { relname: string }[] }>(
      `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind IN('r','p')
          AND EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attname='tenant_id' AND NOT a.attisdropped)
          AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity OR NOT EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid=c.oid))`,
    );
    expect(rows).toEqual([]);
    const { rows: bypass } = await db.raw<{ rows: { rolname: string }[] }>(
      `SELECT rolname FROM pg_roles WHERE rolname LIKE 'parc\\_lending\\_%' AND (rolsuper OR rolbypassrls)`,
    );
    expect(bypass).toEqual([]);
  });

  it("lets the runtime role query loans and see only its own tenant's rows", async () => {
    const tenantId = randomUUID();
    const otherTenantId = randomUUID();
    const tx = await db.transaction();
    try {
      for (const tenant of [tenantId, otherTenantId]) {
        await tx.raw("SELECT set_config('app.current_tenant_id', ?, true)", [
          tenant,
        ]);
        await tx("loan_outbox_events").insert({
          tenant_id: tenant,
          aggregate_type: "LOAN",
          aggregate_id: randomUUID(),
          event_type: "lending.role-grants.test",
          payload: {},
        });
      }
      await tx.raw("SET LOCAL ROLE parc_lending_runtime");
      await tx.raw("SELECT set_config('app.current_tenant_id', ?, true)", [
        tenantId,
      ]);
      await expect(
        tx("loans")
          .where({ tenant_id: tenantId, customer_id: randomUUID() })
          .orderBy("created_at", "desc"),
      ).resolves.toEqual([]);
      const visible = await tx("loan_outbox_events")
        .whereIn("tenant_id", [tenantId, otherTenantId])
        .pluck("tenant_id");
      expect(visible).toEqual([tenantId]);
    } finally {
      await tx.rollback();
    }
  });
});

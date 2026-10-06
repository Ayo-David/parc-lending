import knex, { type Knex } from "knex";
export const createDatabase = (connection: string): Knex =>
  knex({ client: "pg", connection, pool: { min: 0, max: 10 } });
export function withTenantTransaction<T>(
  db: Knex,
  tenantId: string,
  work: (tx: Knex.Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.raw("SELECT set_config('app.current_tenant_id',?,true)", [
      tenantId,
    ]);
    return work(tx);
  });
}

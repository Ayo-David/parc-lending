import type { Knex } from "knex";
const config: Knex.Config = {
  client: "pg",
  connection: process.env.DATABASE_URL ?? "postgresql:///parc_lending",
  migrations: {
    directory: "./db/migrations",
    extension: "ts",
    tableName: "knex_migrations",
  },
};
export default config;

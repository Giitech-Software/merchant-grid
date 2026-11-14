import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabasePool } from "./pool.js";

const migrationsPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../database/migrations");
const pool = createDatabasePool();

await pool.query(`
  create table if not exists schema_migrations (
    filename text primary key,
    applied_at timestamptz not null default now()
  )
`);

const files = (await readdir(migrationsPath)).filter((file) => file.endsWith(".sql")).sort();

for (const filename of files) {
  const existing = await pool.query("select 1 from schema_migrations where filename = $1", [filename]);
  if (existing.rowCount) continue;

  const sql = await readFile(resolve(migrationsPath, filename), "utf8");
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into schema_migrations (filename) values ($1)", [filename]);
    await client.query("commit");
    console.log(`Applied ${filename}`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

await pool.end();

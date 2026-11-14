import { Pool } from "pg";

export function createDatabasePool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create the database pool");
  }

  return new Pool({ connectionString, max: 10 });
}

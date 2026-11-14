import assert from "node:assert/strict";
import test from "node:test";
import { Pool } from "pg";
import { PostgresBusinessRepository } from "./postgres-business-repository.js";
import type { RequestContext } from "../security/request-context.js";

const databaseUrl = process.env.DATABASE_URL;

test("PostgreSQL repository isolates businesses by tenant", { skip: !databaseUrl }, async () => {
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  const tenantA = "00000000-0000-0000-0000-0000000000a1";
  const tenantB = "00000000-0000-0000-0000-0000000000b1";
  const businessA = "00000000-0000-0000-0000-0000000000a2";
  const businessB = "00000000-0000-0000-0000-0000000000b2";

  try {
    await client.query("begin");
    await client.query("insert into tenants (id, legal_name, slug) values ($1, $2, $3), ($4, $5, $6)", [
      tenantA, "Tenant A", "integration-tenant-a", tenantB, "Tenant B", "integration-tenant-b",
    ]);
    await client.query("insert into businesses (id, tenant_id, name, slug) values ($1, $2, $3, $4), ($5, $6, $7, $8)", [
      businessA, tenantA, "Shared Name", "shared-name-a", businessB, tenantB, "Shared Name", "shared-name-b",
    ]);

    const repository = new PostgresBusinessRepository(client as never);
    const contextA: RequestContext = {
      requestId: "integration-a", userId: "user-a", tenantId: tenantA, permissions: new Set(["business.view"]),
    };
    const contextB: RequestContext = {
      requestId: "integration-b", userId: "user-b", tenantId: tenantB, permissions: new Set(["business.view"]),
    };

    assert.equal((await repository.listForTenant(contextA)).length, 1);
    assert.equal((await repository.listForTenant(contextA))[0]?.id, businessA);
    assert.equal((await repository.findById(contextA, businessB)), null);
    assert.equal((await repository.listForTenant(contextB))[0]?.id, businessB);

    await client.query("rollback");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
});

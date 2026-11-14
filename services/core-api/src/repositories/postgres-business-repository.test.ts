import assert from "node:assert/strict";
import test from "node:test";
import { PostgresBusinessRepository } from "./postgres-business-repository.js";
import type { RequestContext } from "../security/request-context.js";

const context: RequestContext = {
  requestId: "request-1",
  tenantId: "tenant-a",
  userId: "user-a",
  permissions: new Set(["business.view"]),
};

test("business lookup binds tenant scope before business id", async () => {
  const calls: unknown[][] = [];
  const pool = {
    query: async (_sql: string, parameters: unknown[]) => {
      calls.push(parameters);
      return { rows: [{ id: "business-a", tenantId: "tenant-a", name: "BuildMart", status: "active" }] };
    },
  } as never;

  const repository = new PostgresBusinessRepository(pool);
  const business = await repository.findById(context, "business-a");

  assert.equal(business?.id, "business-a");
  assert.deepEqual(calls, [["tenant-a", "business-a"]]);
});

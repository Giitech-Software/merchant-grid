import assert from "node:assert/strict";
import test from "node:test";
import { PostgresRoleRepository } from "./postgres-role-repository.js";

test("role repository rejects unknown permissions before inserting", async () => {
  let began = false;
  const client = {
    query: async (sql: string) => {
      if (sql === "begin") began = true;
      if (sql.startsWith("select id, code")) return { rows: [{ id: "permission-a", code: "business.view" }] };
      return { rows: [] };
    },
    release: () => undefined,
  };
  const repository = new PostgresRoleRepository({ connect: async () => client } as never);

  await assert.rejects(
    repository.create(
      { requestId: "request-1", userId: "admin", tenantId: "tenant-a", permissions: new Set(["user.manage-access"]) },
      { name: "Bad Role", permissionCodes: ["missing.permission"] },
    ),
    /Invalid permission code/,
  );
  assert.equal(began, true);
});

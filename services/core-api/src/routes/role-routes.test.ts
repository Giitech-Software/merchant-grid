import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../app.js";

const context = { userId: "admin", tenantId: "tenant-a", permissions: new Set(["user.manage-access"]) };
const roleRepository = {
  listPermissions: async () => [{ code: "business.view", description: "View businesses" }],
  listForTenant: async () => [],
  create: async (_context: typeof context, input: { name: string; description?: string; permissionCodes: string[] }) => ({
    id: "role-a", tenantId: "tenant-a", ...input,
  }),
};

test("authorized admin can list permissions and create a role", async () => {
  const app = buildApp({ verify: async () => context }, undefined, undefined, roleRepository);
  const permissions = await app.inject({ method: "GET", url: "/v1/permissions" });
  const role = await app.inject({ method: "POST", url: "/v1/roles", payload: { name: "Supervisor", permissionCodes: ["business.view"] } });

  assert.equal(permissions.statusCode, 200);
  assert.equal(role.statusCode, 201);
  await app.close();
});

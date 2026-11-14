import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../app.js";

test("authorized admin can create a user", async () => {
  const app = buildApp(
    { verify: async () => ({ userId: "admin", tenantId: "tenant-a", permissions: new Set(["user.manage-access"]) }) },
    undefined, undefined, undefined,
    { list: async () => [], create: async (_context, input) => ({ id: "user-a", ...input, status: "active" }), deactivate: async () => { throw new Error("not used"); } },
  );
  const response = await app.inject({ method: "POST", url: "/v1/users", payload: { email: "staff@example.com", displayName: "Staff Member" } });
  assert.equal(response.statusCode, 201);
  await app.close();
});

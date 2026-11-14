import assert from "node:assert/strict";
import test from "node:test";
import { PostgresMembershipRepository } from "./postgres-membership-repository.js";

test("membership repository refuses a business outside the active context", async () => {
  const repository = new PostgresMembershipRepository({ connect: async () => { throw new Error("must not connect"); } } as never);

  await assert.rejects(
    repository.create({
      requestId: "request-1",
      userId: "admin",
      tenantId: "tenant-a",
      businessId: "business-a",
      permissions: new Set(["user.manage-access"]),
    }, {
      userId: "user-b",
      businessId: "business-b",
      roleId: "role-a",
    }),
    /active business context/,
  );
});

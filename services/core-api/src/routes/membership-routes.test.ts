import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../app.js";

const body = {
  userId: "00000000-0000-0000-0000-000000000001",
  businessId: "00000000-0000-0000-0000-000000000002",
  roleId: "00000000-0000-0000-0000-000000000003",
};

test("membership creation requires manage-access permission", async () => {
  const app = buildApp(
    { verify: async () => ({ userId: "user-a", tenantId: "tenant-a", permissions: new Set() }) },
    undefined,
    { listForBusiness: async () => [], create: async () => { throw new Error("must not be called"); } },
  );

  const response = await app.inject({ method: "POST", url: "/v1/memberships", payload: body });
  assert.equal(response.statusCode, 403);
  await app.close();
});

test("membership creation validates input and passes authorized scope", async () => {
  let tenantId = "";
  const app = buildApp(
    { verify: async () => ({ userId: "user-a", tenantId: "tenant-a", permissions: new Set(["user.manage-access"]) }) },
    undefined,
    {
      listForBusiness: async () => [],
      create: async (context, input) => {
        tenantId = context.tenantId;
        return { ...input, id: "membership-a", tenantId, status: "active" };
      },
    },
  );

  const response = await app.inject({ method: "POST", url: "/v1/memberships", payload: body });
  assert.equal(response.statusCode, 201);
  assert.equal(tenantId, "tenant-a");
  await app.close();
});

test("membership creation returns conflict for duplicate records", async () => {
  const app = buildApp(
    { verify: async () => ({ userId: "user-a", tenantId: "tenant-a", permissions: new Set(["user.manage-access"]) }) },
    undefined,
    { listForBusiness: async () => [], create: async () => { const error = new Error("duplicate"); Object.assign(error, { code: "23505" }); throw error; } },
  );

  const response = await app.inject({ method: "POST", url: "/v1/memberships", payload: body });
  assert.equal(response.statusCode, 409);
  await app.close();
});

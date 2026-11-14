import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "./app.js";
import { BearerTokenSessionVerifier } from "./auth/session-context.js";

test("health endpoint is public", async () => {
  const app = buildApp();
  const response = await app.inject({ method: "GET", url: "/health" });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: "ok", service: "core-api" });
  await app.close();
});

test("context endpoint rejects requests without authenticated context", async () => {
  const app = buildApp();
  const response = await app.inject({ method: "GET", url: "/v1/context" });

  assert.equal(response.statusCode, 403);
  await app.close();
});

test("authentication hook rejects requests without a verified session", async () => {
  const app = buildApp({ verify: async () => null });
  const response = await app.inject({ method: "GET", url: "/v1/context" });

  assert.equal(response.statusCode, 401);
  await app.close();
});

test("business route rejects unauthenticated requests", async () => {
  const app = buildApp(undefined, {
    listForTenant: async () => [], create: async () => { throw new Error("not used"); },
    findById: async () => null,
  });
  const response = await app.inject({ method: "GET", url: "/v1/businesses" });

  assert.equal(response.statusCode, 401);
  await app.close();
});

test("authenticated business route uses verified tenant context", async () => {
  let observedTenantId = "";
  const app = buildApp(
    {
      verify: async () => ({
        userId: "user-a",
        tenantId: "tenant-a",
        businessId: "business-a",
        permissions: new Set(["business.view"]),
      }),
    },
    {
      listForTenant: async (context) => {
        observedTenantId = context.tenantId;
        return [{ id: "business-a", tenantId: context.tenantId, name: "BuildMart", status: "active" }];
      },
      findById: async () => null, create: async () => { throw new Error("not used"); },
    },
  );

  const response = await app.inject({ method: "GET", url: "/v1/businesses" });

  assert.equal(response.statusCode, 200);
  assert.equal(observedTenantId, "tenant-a");
  assert.equal(response.json().data[0].tenantId, "tenant-a");
  await app.close();
});

test("authenticated user without permission is forbidden", async () => {
  const app = buildApp(
    { verify: async () => ({ userId: "user-a", tenantId: "tenant-a", permissions: new Set() }) },
    { listForTenant: async () => [], findById: async () => null, create: async () => { throw new Error("not used"); } },
  );

  const response = await app.inject({ method: "GET", url: "/v1/businesses" });

  assert.equal(response.statusCode, 403);
  await app.close();
});

test("bearer authentication resolves API scope from membership, not token claims", async () => {
  let repositoryTenant = "";
  const verifier = new BearerTokenSessionVerifier(
    {
      // The provider returns identity only; it cannot grant a tenant.
      introspect: async () => ({ userId: "user-a" }),
    },
    {
      // The membership store determines the authoritative tenant scope.
      resolve: async (userId) => ({
        userId,
        tenantId: "tenant-from-membership",
        businessId: "business-from-membership",
        permissions: new Set(["business.view"]),
      }),
    },
  );
  const app = buildApp(verifier, {
    listForTenant: async (context) => {
      repositoryTenant = context.tenantId;
      return [];
    },
      findById: async () => null, create: async () => { throw new Error("not used"); },
  });

  const response = await app.inject({
    method: "GET",
    url: "/v1/businesses",
    headers: { authorization: "Bearer provider-token" },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(repositoryTenant, "tenant-from-membership");
  await app.close();
});

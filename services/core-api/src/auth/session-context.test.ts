import assert from "node:assert/strict";
import test from "node:test";
import { BearerTokenSessionVerifier } from "./session-context.js";

test("bearer verifier delegates only a bearer token", async () => {
  let received = "";
  const verifier = new BearerTokenSessionVerifier({
    introspect: async (token) => {
      received = token;
      return { userId: "user-a" };
    },
  }, {
    resolve: async (userId) => ({
      userId,
      tenantId: "tenant-a",
      permissions: new Set(["business.view"]),
    }),
  });

  const session = await verifier.verify({
    headers: { authorization: "Bearer signed-token" },
  } as never);

  assert.equal(received, "signed-token");
  assert.equal(session?.tenantId, "tenant-a");
});

test("bearer verifier rejects missing or malformed authorization", async () => {
  let calls = 0;
  const verifier = new BearerTokenSessionVerifier({
    introspect: async () => {
      calls += 1;
      return null;
    },
  }, { resolve: async () => null });

  assert.equal(await verifier.verify({ headers: {} } as never), null);
  assert.equal(await verifier.verify({ headers: { authorization: "Basic abc" } } as never), null);
  assert.equal(calls, 0);
});

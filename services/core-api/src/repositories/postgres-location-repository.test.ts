import assert from "node:assert/strict";
import test from "node:test";
import { PostgresLocationRepository } from "./postgres-location-repository.js";

test("location creation requires an active business context", async () => {
  const repository = new PostgresLocationRepository({ connect: async () => { throw new Error("must not connect"); } } as never);
  await assert.rejects(
    repository.create({ requestId: "r1", userId: "u1", tenantId: "t1", permissions: new Set(["business.configure"]) }, { name: "Shop", code: "SHOP" }),
    /business context/,
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import { AutomaticPostingService } from "./automatic-posting.js";

const context = { requestId: "test", userId: "user", tenantId: "tenant", businessId: "business", permissions: new Set(["accounting.post"]) };
const mappings = { get: async (_context: typeof context, key: string) => ({ cash: "cash", accounts_receivable: "ar", inventory: "inventory", sales_revenue: "sales", cost_of_goods_sold: "cogs" }[key] ?? null) };

test("automatic sale posting submits balanced journal lines", async () => {
  let received: any;
  const service = new AutomaticPostingService({ postJournal: async (_context, input) => { received = input; return { id: "j", entryNumber: "JE-1", status: "posted", total: "160" }; } }, mappings);
  await service.postSale(context, "invoice", "100", "60");
  assert.equal(received.sourceId, "invoice");
  assert.equal(received.lines.reduce((sum: number, line: any) => sum + Number(line.debit ?? 0), 0), 160);
  assert.equal(received.lines.reduce((sum: number, line: any) => sum + Number(line.credit ?? 0), 0), 160);
});

test("automatic posting fails when a required mapping is missing", async () => {
  const service = new AutomaticPostingService({ postJournal: async () => { throw new Error("must not post"); } }, { get: async () => null });
  await assert.rejects(service.postCollection(context, "payment", "25"), /mapping is missing/);
});

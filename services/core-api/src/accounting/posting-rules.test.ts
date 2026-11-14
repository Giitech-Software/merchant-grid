import assert from "node:assert/strict";
import test from "node:test";
import { customerCollectionPosting, salePosting } from "./posting-rules.js";

function total(lines: readonly { debit?: string; credit?: string }[]) {
  return [lines.reduce((sum, line) => sum + Number(line.debit ?? 0), 0), lines.reduce((sum, line) => sum + Number(line.credit ?? 0), 0)];
}

test("sale posting balances revenue and inventory effects", () => {
  assert.deepEqual(total(salePosting({ cash: "cash", accountsReceivable: "ar", inventory: "inventory", salesRevenue: "sales", costOfGoodsSold: "cogs" }, "100", "60")), [160, 160]);
});

test("customer collections settle receivables", () => {
  assert.deepEqual(total(customerCollectionPosting({ cash: "cash", accountsReceivable: "ar", inventory: "inventory", salesRevenue: "sales", costOfGoodsSold: "cogs" }, "25")), [25, 25]);
});

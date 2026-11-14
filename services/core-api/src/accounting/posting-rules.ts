import type { JournalLineInput } from "../repositories/accounting-repository.js";

export type PostingAccounts = {
  cash: string;
  accountsReceivable: string;
  inventory: string;
  salesRevenue: string;
  costOfGoodsSold: string;
};

export function salePosting(accounts: PostingAccounts, total: string, costOfGoodsSold: string): readonly JournalLineInput[] {
  return [
    { accountId: accounts.accountsReceivable, debit: total },
    { accountId: accounts.salesRevenue, credit: total },
    { accountId: accounts.costOfGoodsSold, debit: costOfGoodsSold },
    { accountId: accounts.inventory, credit: costOfGoodsSold },
  ];
}

export function customerCollectionPosting(accounts: PostingAccounts, amount: string): readonly JournalLineInput[] {
  return [
    { accountId: accounts.cash, debit: amount },
    { accountId: accounts.accountsReceivable, credit: amount },
  ];
}

import type { RequestContext } from "../security/request-context.js";
import type { AccountingRepository, JournalRecord } from "../repositories/accounting-repository.js";
import { customerCollectionPosting, salePosting, type PostingAccounts } from "./posting-rules.js";

export interface AccountMappingReader {
  get(context: RequestContext, key: string): Promise<string | null>;
}

export class AutomaticPostingService {
  public constructor(private readonly journals: AccountingRepository, private readonly mappings: AccountMappingReader) {}

  public async postSale(context: RequestContext, sourceId: string, total: string, costOfGoodsSold: string): Promise<JournalRecord> {
    const accounts = await this.resolveAccounts(context);
    return this.journals.postJournal(context, {
      sourceType: "sales_invoice",
      sourceId,
      description: "Posted sale",
      lines: salePosting(accounts, total, costOfGoodsSold),
    });
  }

  public async postCollection(context: RequestContext, sourceId: string, amount: string): Promise<JournalRecord> {
    const accounts = await this.resolveAccounts(context);
    return this.journals.postJournal(context, {
      sourceType: "customer_payment",
      sourceId,
      description: "Customer collection",
      lines: customerCollectionPosting(accounts, amount),
    });
  }

  private async resolveAccounts(context: RequestContext): Promise<PostingAccounts> {
    const keys: (keyof PostingAccounts)[] = ["cash", "accountsReceivable", "inventory", "salesRevenue", "costOfGoodsSold"];
    const mappingKeys: Record<keyof PostingAccounts, string> = { cash: "cash", accountsReceivable: "accounts_receivable", inventory: "inventory", salesRevenue: "sales_revenue", costOfGoodsSold: "cost_of_goods_sold" };
    const values = await Promise.all(keys.map((key) => this.mappings.get(context, mappingKeys[key])));
    if (values.some((value) => !value)) throw new Error("Required accounting mapping is missing");
    return Object.fromEntries(keys.map((key, index) => [key, values[index]!])) as PostingAccounts;
  }
}

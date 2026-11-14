# Automatic posting boundary

`AutomaticPostingService` converts verified operational events into balanced journals. It resolves account IDs through tenant-scoped mappings and attaches the originating source ID to the journal.

Required integrations:

- Posted sale → sale revenue/receivable and COGS/inventory journals.
- Customer payment → cash/bank/mobile-money and receivable journal.
- Supplier payment → payable and cash/bank journal.
- Expense → expense and cash/bank journal.
- Return/refund → reversal of revenue/receivable and inventory disposition effects.

Each integration must call the service only after its source transaction has passed its own validation, and must preserve idempotency for retries.

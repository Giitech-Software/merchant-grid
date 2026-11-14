# MerchantGrid Phase 1 Scope

## Objective

Deliver a production-quality core business platform for BuildMart General Ventures, initially operating one location while preserving tenant, business, and multi-location boundaries.

## Delivery order

1. Platform foundation: tenant, business, location, membership, roles, permissions, authentication boundary, audit events, licensing hooks.
2. Product foundation: categories, products, variants, barcodes, units, immutable conversion snapshots.
3. Inventory: ledger, balances, receipts/issues/adjustments, counts, weighted-average costing.
4. Sales/POS: invoices, receipts, payments, returns, credit notes, controlled reversals.
5. Customers and credit: balances, allocations, statements, limits, collections.
6. Suppliers and purchasing: orders, receipts, supplier invoices, payables, payments.
7. Expenses and accounting: payment accounts, journal rules, general ledger, trial balance, P&L.
8. Operations: receipt generation, backups/restore, monitoring, dashboard, public catalogue projection.

## First vertical slice acceptance criteria

- A tenant can own one or more businesses.
- A business can own one or more locations.
- A user membership is scoped to a tenant and business, with optional location scope.
- Every protected request resolves tenant context server-side.
- Cross-tenant reads and writes are rejected at the data-access boundary.
- Permission checks are explicit and are not based on hidden UI controls.
- Sensitive mutations emit an append-only audit event with actor, action, target, timestamp, and context.
- Database migrations can create and tear down the foundation schema in a test database.
- Automated tests cover the isolation and authorization rules.

## Non-goals for this slice

POS, inventory, accounting, offline sync, payment integrations, and public catalogue UI. These depend on the foundation contracts and will be added only after this slice passes review.


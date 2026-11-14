# ADR 0001: Start with a modular monolith

- Status: Accepted for Phase 1
- Date: 2026-11-12

## Decision

Start with a strongly modular backend and a versioned API. Domain modules share one deployable process initially, but communicate through explicit application interfaces and domain events. Each module owns its tables and access rules.

## Rationale

Phase 1 needs transactional consistency across identity, inventory, sales, and accounting. Premature service separation would add operational and synchronization complexity before transaction boundaries are proven. Clear module boundaries preserve a later extraction path.

## Constraints

- PostgreSQL is authoritative for shared operational transactions.
- Authorization and tenant isolation are enforced server-side at the data-access boundary.
- Posted financial and stock records are corrected through reversal/replacement workflows.
- External integrations use idempotent events and cannot bypass domain rules.


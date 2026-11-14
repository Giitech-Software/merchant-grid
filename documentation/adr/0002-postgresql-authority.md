# ADR 0002: PostgreSQL is the shared transaction authority

- Status: Accepted for Phase 1
- Date: 2026-11-12

## Decision

PostgreSQL is authoritative for tenant, operational, stock, and accounting transactions. SQLite may be introduced later for a client cache/offline workspace, but never as a competing shared stock or accounting authority.

## Consequences

All posted transactions receive durable identifiers and audit context. Offline work queues must be validated and committed by the authoritative server; synchronization cannot silently overwrite authoritative records.


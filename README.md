# MerchantGrid

Enterprise business platform for BuildMart General Ventures.

This repository starts with the Phase 1 foundation defined in the MerchantGrid Product Requirements & Technical Foundation (v2.0). The initial implementation is deliberately modular: one deployable API can contain multiple domain modules while preserving clear boundaries for later extraction.

## Planned workspace

- `apps/` — user-facing applications
- `services/` — backend deployables and domain modules
- `packages/` — shared types, validation, business rules, and API clients
- `database/` — migrations, seeds, and schema documentation
- `documentation/` — requirements, ADRs, workflows, and runbooks
- `testing/` — cross-module and end-to-end test assets

## First vertical slice

Tenant → business → location → user membership → authorization-aware API health check.

The first slice must establish tenant isolation, auditability, migrations, and test conventions before products, inventory, or POS are added.


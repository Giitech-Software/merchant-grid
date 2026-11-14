# ADR 0003: TypeScript API with PostgreSQL-first persistence

- Status: Accepted for Phase 1
- Date: 2026-11-12

## Decision

Use TypeScript for the API and shared domain contracts. The API may begin as a single deployable service, with PostgreSQL accessed through explicit repositories and migrations. Framework selection remains an implementation detail until the first API proof-of-concept is benchmarked.

## Rationale

TypeScript allows validation schemas, API contracts, permission names, and frontend clients to share typed contracts while preserving a clean database boundary. Keeping framework choice open avoids coupling the domain model to an unbenchmarked framework.


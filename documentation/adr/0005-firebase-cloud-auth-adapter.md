# ADR 0005: Firebase Admin as the initial cloud identity adapter

- Status: Accepted for initial cloud deployment
- Date: 2026-11-12

## Decision

Use Firebase Admin SDK to verify Firebase ID tokens in the cloud API. The adapter returns only the verified Firebase user ID. Tenant, business, location, role, and permission scope is resolved from MerchantGrid PostgreSQL memberships.

## Consequences

Firebase credentials remain server-side environment secrets and are never bundled into clients. Standalone/offline deployments can replace this adapter with a local identity implementation using the same `TokenIntrospector` contract.


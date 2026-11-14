# ADR 0004: Provider-independent authentication boundary

- Status: Accepted for Phase 1
- Date: 2026-11-12

## Decision

The API accepts bearer credentials through a `SessionVerifier` interface. Provider-specific verification is delegated to an injected `TokenIntrospector`, which returns only verified user, tenant, business/location scope, and permission claims.

## Rationale

Firebase Authentication is a candidate integration, but standalone and offline deployment may require a local or licensed identity service. The API must not couple authorization to one provider or trust unsigned client claims.

## Rules

- Tokens are verified by the provider adapter before request context is created.
- Tenant and business scope comes from verified claims and server-side membership lookup.
- The client cannot select a tenant by header or request body.
- Owner and administrator MFA enforcement remains a provider and policy concern, but authorization must receive the resulting verified session state.

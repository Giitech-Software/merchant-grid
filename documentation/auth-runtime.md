# Authentication runtime

When Firebase Admin credentials are configured, `server.ts` composes:

`FirebaseTokenIntrospector → BearerTokenSessionVerifier → PostgresMembershipResolver → RequestContext`

The Firebase token provides only the verified user ID. MerchantGrid PostgreSQL determines active membership, tenant, business, optional location, and permissions.

If Firebase credentials are missing, the API may start for local health checks, but protected routes return `401`. This fail-closed behavior is intentional.

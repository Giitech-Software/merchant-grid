# Database integration tests

The core API PostgreSQL integration test requires:

1. PostgreSQL running from `docker-compose.yml`.
2. Migrations applied with `pnpm --filter @merchantgrid/core-api migrate`.
3. `DATABASE_URL` set in the environment.

The test creates two tenants and verifies that repository queries cannot cross the tenant boundary. Test records are rolled back in a transaction.

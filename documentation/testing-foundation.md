# Testing foundation

The API tests currently cover:

- Public health availability.
- Missing authentication rejection.
- Missing permission rejection.
- Authenticated tenant context propagation into repositories.
- Repository parameter binding for tenant-scoped business lookup.

The next integration layer should run against PostgreSQL and create two tenants with similar business IDs or records. It must prove that a session for tenant A cannot read or mutate tenant B data, including through direct repository calls and HTTP routes.

Accounting tests also cover balanced sale journal generation and fail-closed behavior when required account mappings are absent.

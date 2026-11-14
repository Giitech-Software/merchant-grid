# Database development workflow

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL with `docker compose up -d postgres`.
3. Apply all pending migrations with the repository runner:

   ```powershell
   pnpm migrate
   ```

   The runner records applied filenames in `schema_migrations` and is safe to rerun.
4. Set `DATABASE_URL` for the API process.

From the repository root, build the API and run its migration command before starting the server. The server can start without authentication wiring for local route composition, but protected routes intentionally return `401` until a verified `SessionVerifier` is supplied.

The migration files are intentionally plain SQL. Each migration runs once inside a transaction.

The local database is development-only. Production credentials, encryption, backups, retention, and restore verification must be managed separately.

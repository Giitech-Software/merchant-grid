# Accounting outbox

Operational modules enqueue accounting events in the same transaction as the source record. A worker later claims pending events, resolves account mappings, posts a balanced journal, and marks the event posted.

Required worker behavior:

- Claim with row locking and a lease.
- Retry transient failures with backoff.
- Preserve the unique source event key for idempotency.
- Mark permanent failures with an actionable error.
- Never mark an event posted before the journal transaction commits.

Source repositories should call `enqueueAccountingEvent` before committing their transaction. The unique source-event constraint makes repeated enqueue attempts safe.

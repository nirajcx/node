# Test strategy

`npm test` runs unit and HTTP integration tests without a database or Redis. HTTP tests use a temporary loopback port and injectable fake dependencies.

`npm run test:db` is an explicit opt-in test against the configured PostgreSQL instance. It checks parameterized queries, date serialization, transactions/rollback and reuse. Its only DDL creates a temporary table inside a transaction with ON COMMIT DROP. It does not change application records or apply migrations.

Future feature/repository tests must use a separate TEST_DATABASE_URL, isolated fixtures, migration setup and deterministic cleanup. Never run destructive cleanup against a development/production database. Authentication and todo business behavior are not covered yet because they are intentionally unimplemented.

Required future coverage: session cookie lifecycle, validation, uniqueness, unauthenticated requests, cross-user reads/writes, expired sessions, CSRF, rate limiting, database failure, Redis outage if enabled, shutdown and frontend contract compatibility.

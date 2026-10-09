# Implementation roadmap

This project intentionally separates completed infrastructure from feature implementation. Start at [README.md](README.md) for the full directory tree and current status.

## Recommended reading order

1. [Architecture](docs/ARCHITECTURE.md): understand the responsibilities of each layer.
2. [Configuration](docs/CONFIGURATION.md): configure and verify PostgreSQL.
3. [API contract](docs/API.md): implement the exact contract used by the frontend.
4. [Learning milestones](docs/LEARNING.md): complete exercises in dependency order.
5. [Operations](docs/OPERATIONS.md): validate runtime and release requirements.
6. [Redis plan](docs/REDIS.md): add Redis only when a concrete feature needs it.

## Implementation order

Database schema and migration workflow → strict validators → user/session repositories → session helpers and authentication → authorization/CSRF/rate limits → todo repositories/services/controllers → integration tests → real frontend connection → deployment checks.

Do not reimplement the pool, response envelope or error handler inside feature modules. Controllers use `sendSuccess`; expected domain failures throw `ApiError`; unexpected failures reach the final Express error handler.

## Definition of done for a feature

- Validated inputs and documented status codes.
- Contract-compatible success/error envelopes.
- Parameterized SQL and server-derived ownership.
- No credentials, hashes or sensitive fields in responses/logs.
- Tests for happy paths, invalid inputs, unauthenticated requests and cross-user access.
- Documented implementation status and operational considerations.
- No unexpected schema changes during application startup.

Authentication and todo routes remain deliberate 501 stubs until these requirements are met. Do not describe the entire application as production-ready while those features are incomplete.

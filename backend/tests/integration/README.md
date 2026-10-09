# Integration tests

`http.test.js` starts the Express factory on an ephemeral loopback port. It verifies envelopes/request IDs, health/readiness, failure secrecy, parser limits, CORS and feature stubs. No external database is required.

`database.test.js` runs only through `npm run test:db` and uses your configured real PostgreSQL connection. It creates no durable application tables or records. It validates date mapping, parameterized SQL and transactional cleanup.

When adding business repositories, introduce a separate test database and fixture lifecycle. Never use FLUSHALL/FLUSHDB, global table truncation or another application's data for tests.

`startup.test.js` launches the real entry point with invalid configuration or an unreachable loopback PostgreSQL endpoint. It checks bounded nonzero exit behavior without exposing secrets.

`redis.test.js` uses a temporary TCP server that never completes the Redis handshake. It verifies the total connection deadline and cleanup without connecting to an existing Redis service.

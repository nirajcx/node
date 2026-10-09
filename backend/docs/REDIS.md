# Redis: optional infrastructure and future learning

## Current behavior

`src/config/redis.js` provides a lifecycle adapter only: connect, bounded ping, close and an enabled flag. It is **disabled by default** and does not connect or affect readiness when disabled. No keys are written and no existing Redis data is changed.

When enabled, startup requires Redis to connect; readiness checks it alongside PostgreSQL. Offline command queues and automatic reconnect loops are disabled deliberately. After a runtime disconnect, readiness fails; restore the dependency and restart the process through the supervisor. This behavior is simple and explicit. A future reconnect policy must add bounded backoff, tests and observability before replacing it.

## Enabling locally

Use a Redis instance you control. Do not reuse another application's credentials or flush its databases.

```dotenv
REDIS_ENABLED=true
REDIS_URL=redis://127.0.0.1:6379
REDIS_CONNECT_TIMEOUT_MS=3000
```

Restart the backend and check `/api/ready`: `data.redis` should be `"up"`. For an authenticated deployment use Redis ACL credentials and `rediss://` when TLS is required. Keep the URL secret.

The adapter does not yet expose arbitrary cache commands. Add a dedicated interface and tests when implementing the selected feature; do not let controllers manage raw connections.

## Choose a use case

| Use case           | Benefit                               | Required decisions                                                                                |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Shared rate limits | Consistent counters across replicas   | Atomic operations, TTL/window semantics, trusted client identity, fail-closed auth policy         |
| Read cache         | Less repeated DB work                 | Per-user keys, TTL, invalidation, stale reads, memory budget, cache failure fallback              |
| Sessions           | Fast shared session lookup/revocation | Durable source of truth, TTL/expiry, eviction policy, restart behavior, fail-closed authorization |
| Background queue   | Async work                            | Pick a queue library, retry/idempotency policy, worker lifecycle, dead-letter handling            |

Start with a concrete measured need. PostgreSQL is sufficient for this application's initial durable records and sessions.

## Key conventions and safety

Proposed namespace: `dayflow:<environment>:v1:<feature>:<userId>:<resourceId>`.

- Include user scope for user-private cached data.
- Use explicit TTLs; do not rely on manual cleanup.
- Never cache passwords or raw bearer/session tokens.
- Invalidate todo list/item keys after successful transaction commit.
- Prevent cache stampedes with a documented, bounded coordination policy.
- Do not use production-wide `FLUSHALL`, `FLUSHDB` or blocking `KEYS` operations.
- Use dedicated ACLs/instances where appropriate; logical database numbers alone are not a security boundary.

## Outage contract

Decide per feature. A read cache may fall back to PostgreSQL; authentication and abuse controls must not silently fail open. Current enabled Redis is a required readiness dependency. If Redis later becomes a dispensable cache, intentionally update readiness semantics and tests rather than ignoring failures globally.

## Acceptance tests for a Redis feature

- Disabled mode requires no Redis.
- Enabled but unreachable Redis fails startup within a deadline.
- Runtime disconnect makes readiness fail or uses the documented feature fallback.
- Keys isolate environments/users; no cross-user cached response.
- TTL expiry and invalidation after create/update/delete are verified.
- Concurrent writes/counter operations preserve required atomicity.
- Shutdown leaves no open clients or hanging command promises.
- Tests never flush an unrelated Redis instance.

Reference: [Node Redis connection guide](https://redis.io/docs/latest/develop/clients/nodejs/connect/).

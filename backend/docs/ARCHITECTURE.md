# Architecture

## Dependency direction

```text
HTTP request
  → request context / security headers / CORS / JSON parser / cookies
  → route
  → authentication + CSRF + rate limits + validation (feature work)
  → controller
  → service
  → repository
  → PostgreSQL

Success: controller → sendSuccess → JSON
Failure: throw / next(error) → centralized error middleware → sendError → JSON
```

`server.js` is the composition root. It validates config, creates logger/pool/optional Redis, verifies dependencies, builds the app, and starts HTTP. `app.js` exports a factory without opening sockets. Tests inject fake infrastructure to test HTTP behavior deterministically.

## Layer contracts

| Layer        | Owns                                                  | Must not own                         |
| ------------ | ----------------------------------------------------- | ------------------------------------ |
| config       | Environment parsing and infrastructure lifecycle      | Feature business decisions           |
| routes       | URLs, middleware order, controller selection          | SQL or password hashing              |
| middleware   | Cross-cutting request gates and errors                | Todo business logic                  |
| validators   | Strict input schemas and normalization                | Database calls                       |
| controllers  | Validated input, HTTP status/cookies, response helper | SQL, transactions, hashing           |
| services     | Business rules and transaction boundaries             | Express req/res objects              |
| repositories | Parameterized SQL, row mapping and owner scoping      | HTTP responses or cookies            |
| utils        | Small shared error/response/session helpers           | Hidden infrastructure initialization |

`app.locals.database` exposes the initialized adapter for future controller/service composition. Prefer passing this adapter into service/repository factories as features grow. Do not construct a new pool per request.

## PostgreSQL lifecycle

One bounded pool per Node process. Startup `SELECT 1` must succeed before listen. Query, statement, connection and idle-transaction timeouts are configured. DATE values remain date-only strings. TLS verification stays enabled when TLS is configured.

Use `database.query(sql, params)` for one statement. Use `database.transaction(async client => { ... })` for atomic operations; every statement inside must use that same client. The helper commits or rolls back, always releases the client, and discards it if rollback fails. Do not perform slow HTTP calls while holding a transaction.

## Error boundaries

The backend boundary is an Express error middleware, not a React component. It converts known failures to public codes and genericizes unexpected errors. Expected feature errors use `ApiError`; direct responses should use `sendSuccess`.

The frontend separately contains `error.tsx` and `global-error.tsx`. They cover rendering failures and root-layout failures. Request/event-handler errors remain handled by Axios try/catch and user-visible feedback; React error boundaries do not automatically catch those errors. Neither UI boundary displays raw error messages or stack traces.

## State and future dependencies

PostgreSQL remains the durable source of truth. Redis is optional and disabled by default. It currently has a connection/readiness/shutdown adapter only. See [Redis design](REDIS.md) before adding caching, shared rate limiting or session storage.

## Production boundary

Middleware and infrastructure do not implement authentication. Feature stubs intentionally return 501. Do not replace them with unauthenticated database access as an intermediate deployment. Complete authorization, CSRF, rate limits, schema constraints and adversarial tests first.

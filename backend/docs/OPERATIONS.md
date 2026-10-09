# Operations and release readiness

## Current scope

The infrastructure is implemented. Feature endpoints still return 501. Authentication, authorization, CSRF, rate limiting, migrations and application data access are unfinished. **Do not expose this learning application publicly as a production service.**

## Startup

1. Validate environment without printing secret values.
2. Create the logger, PostgreSQL pool and optional Redis adapter.
3. Verify PostgreSQL, connect Redis if enabled, and verify it.
4. Bind HTTP only after dependency checks succeed.

Startup failure produces a safe JSON log (or a generic configuration error), closes created resources and exits nonzero. Startup retries belong to the process supervisor; an endless internal retry loop must not hide broken configuration.

`HOST=127.0.0.1` is the local default. A container deployment normally uses `HOST=0.0.0.0` behind a configured ingress. Set `NODE_ENV=production` and inject secrets through the runtime; `npm start` does not require a local `.env` file.

## Health probes

- `/api/health`: process liveness; does not query dependencies.
- `/api/ready`: performs bounded dependency checks; fails while shutting down or if a required service is unavailable.
- Redis is required for readiness only when explicitly enabled.

A database outage should remove an instance from traffic through readiness, not trigger an unbounded liveness restart storm. Limit probe frequency and protect health endpoints at the network layer if needed.

## Shutdown and fatal failures

SIGINT/SIGTERM set the shutdown flag, stop accepting connections, close idle HTTP connections, drain active requests, then close Redis and PostgreSQL. A hard deadline closes connections and exits with failure if graceful termination stalls. Set the platform termination grace period above `SHUTDOWN_TIMEOUT_MS`.

Unhandled rejections and uncaught exceptions are fatal: drain and terminate with a nonzero code. Do not continue serving in an unknown state. Use an external supervisor/restart policy. Test interruption during a transaction before release.

HTTP request/body reception timeout is not a deadline for arbitrary application work. Database operations have their own bounds; future external HTTP calls must have explicit cancellation/deadlines too.

## Logging

Pino writes JSON to stdout. Request logs include a server-generated UUID, method, matched route template, status and duration. Error logs include stable application codes and safe driver codes/types. Raw query strings, SQL, request bodies, cookies, passwords and driver error messages are omitted.

Correlate a reported `meta.requestId` / `X-Request-Id` with logs. Add monitored latency, error-rate, readiness and connection-pool metrics before production. Configure log retention and access controls outside the application. Redaction is defense in depth; do not add secrets to log fields.

## Security boundaries

- Helmet and CORS are wired; neither substitutes for authentication or authorization.
- The app intentionally does not trust arbitrary forwarding headers. Configure trusted proxy addresses/hops only for your deployment.
- JSON bodies are capped at 16 KB.
- All application JSON responses use no-store headers.
- Cookie authentication needs CSRF protection before real mutations are enabled.
- Rate limiting must be implemented before public auth endpoints; multiple replicas need a shared store.
- Use verified database/Redis TLS on networks that require it.
- Runtime database credentials should have only required DML permissions; migration credentials are separate.
- Public registration may require email verification, password recovery and abuse controls according to the product's requirements. These are not implemented.

## Release checklist

- [ ] All intended auth/todo endpoints implemented with the documented contract.
- [ ] Strict schema validation, safe password handling and session revocation tested.
- [ ] Cross-user authorization tests pass for every operation.
- [ ] CSRF and shared rate limiting implemented and tested.
- [ ] Migration history, locking and controlled release migration job exist.
- [ ] Test and production data are isolated; no demo credentials/data in production.
- [ ] Secrets injected securely; least-privilege roles; transport security verified.
- [ ] Frontend built with demo mode false and the correct public API origin.
- [ ] Reverse proxy, body limits, request deadlines and trust-proxy rules verified.
- [ ] Dependency audits reviewed and outstanding advisories resolved or documented with justification.
- [ ] CI covers lint/syntax/types/build, unit tests and integration tests.
- [ ] Load test establishes pool sizes, concurrency and response-time budgets.
- [ ] Structured logs, dashboards, alerts and error reporting are operational.
- [ ] Backup and restore tested; recovery objectives and release rollback documented.
- [ ] Graceful shutdown, dependency outage and failed-migration drills pass.

## Dependency maintenance

Use `npm ci` with committed lockfiles, review version changes and run tests before upgrades. Never apply `npm audit fix --force` blindly: a major downgrade can break framework compatibility. Audit backend and frontend independently, including build/development tooling in CI.

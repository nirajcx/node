# Backend learning milestones

Complete these in order. Each milestone has concrete deliverables and acceptance criteria. Check items only when implemented and verified; these are currently unchecked feature tasks.

## 1. Understand the foundation

- [ ] Trace a health request through context, headers, route and response helper.
- [ ] Explain why readiness depends on PostgreSQL while liveness does not.
- [ ] Run `npm test` and inspect a malformed-JSON response.
- [ ] Explain connection pooling, transaction client ownership and graceful shutdown.

**Done when:** you can explain every field in the standard envelope and find the same request ID in logs.

## 2. Schema and migrations

- [ ] Write `001_initial.sql` for users, sessions and todos (see migration README).
- [ ] Add primary/foreign keys, normalized unique email, NOT NULL/CHECK constraints and indexes.
- [ ] Choose and implement a versioned migration runner with a migration history table and a concurrency lock.
- [ ] Separate migration ownership from runtime permissions for deployment.
- [ ] Practice a forward migration, failure rollback and backup/restore in a disposable database.

**Done when:** a clean development/test database can be created reproducibly, repeated migration runs are safe, and schema changes do not happen during API startup.

## 3. Validation

- [ ] Write strict registration/login schemas, normalized email and trimmed names.
- [ ] Enforce bcrypt's UTF-8 password byte limit.
- [ ] Write todo create/patch schemas; reject unknown fields and empty patches.
- [ ] Validate UUID parameters and real calendar dates, including leap years.
- [ ] Apply `validate(schema, source)` and consume `res.locals.validated`.

**Done when:** tests cover whitespace, size limits, unknown fields, impossible dates, malformed IDs and partial updates.

## 4. User and session repositories

- [ ] Implement parameterized queries and safe user projections.
- [ ] Store password hashes, never raw passwords.
- [ ] Generate random session tokens and persist only SHA-256 token hashes.
- [ ] Add session expiration and revocation queries.
- [ ] Implement atomic registration/session creation where appropriate.

**Done when:** repositories have isolated DB tests; no password/hash/token is returned by a public user mapper.

## 5. Authentication

- [ ] Implement register, login, current user and logout services/controllers.
- [ ] Choose and benchmark bcrypt cost; use asynchronous hashing.
- [ ] Create HttpOnly cookies with secure production flags and matching expiry.
- [ ] Implement `requireAuth`, set the server-derived `req.user` and reject invalid/expired sessions.
- [ ] Rotate the session at login; revoke server state and clear cookies at logout.
- [ ] Keep registration/login failures safe and consistent.

**Done when:** cookie/session lifecycle, duplicate registration, invalid credentials, expiry and logout are integration tested.

## 6. Request security

- [ ] Implement CSRF protection for cookie-authenticated mutations, including login/logout considerations.
- [ ] Reject unexpected mutation origins; define and test behavior for absent Origin/non-browser clients.
- [ ] Add authentication and write rate limits with standard 429 responses and Retry-After.
- [ ] Document exact reverse-proxy trust rules before trusting forwarded IPs.
- [ ] Decide whether public signup needs email verification and account recovery before launch.

**Done when:** blocked origins, missing CSRF proof, repeated login attempts and forged client IP scenarios are tested. CORS alone is not treated as CSRF protection.

## 7. Todo implementation and ownership

- [ ] Implement owner-scoped list/create/update/delete repository methods.
- [ ] Implement services without Express dependencies.
- [ ] Implement controllers using the shared success helper.
- [ ] Require authentication on the entire todo router.
- [ ] Use a fixed PATCH column allowlist and parameterized values.
- [ ] Return full updated objects and the documented field names/date formats.

**Done when:** user A cannot list, edit or delete user B's records; nonexistent/foreign IDs both return 404; writes persist across reloads.

## 8. Full integration and error cases

- [ ] Use a separate TEST_DATABASE_URL and isolated fixtures when feature tests are added.
- [ ] Cover malformed JSON, validation, auth, ownership, duplicate data and transaction rollback.
- [ ] Verify cookies and CORS from the real frontend.
- [ ] Set demo mode false and test the whole browser journey.
- [ ] Test API unavailability without silently falling back to demo mode.
- [ ] Verify UI error boundaries separately from request errors.

**Done when:** frontend/backend contract tests and real browser flows pass without credential leaks.

## 9. Redis, only after a measured need

- [ ] Read REDIS.md and pick one use case: shared rate limits, cache or sessions.
- [ ] Define per-environment/per-user key namespaces, TTLs and failure behavior.
- [ ] Implement and test invalidation, multi-user isolation and outage behavior.
- [ ] Avoid key scans/global flushes on a shared Redis service.

**Done when:** the feature remains correct during Redis failure and its consistency/security behavior is documented.

## 10. Release engineering

- [ ] CI: npm ci, syntax/unit/integration tests, frontend lint/type/build, dependency audit.
- [ ] Migrations run once per release through a controlled job.
- [ ] Least-privilege runtime credentials and verified transport security.
- [ ] Logs/metrics/alerts, tested graceful termination and restart policy.
- [ ] Backup/restore drill, load test, connection budget and rollback procedure.
- [ ] Accessibility and error-state checks for the frontend.

**Done when:** every applicable item in OPERATIONS.md is satisfied with evidence, not just a passing build.

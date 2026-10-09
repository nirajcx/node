# HTTP API contract

Base URL: `http://localhost:4000/api`. JSON request bodies use `Content-Type: application/json`. Real browser authentication will use an HttpOnly session cookie; Axios already sends credentials.

**Implemented endpoints:** `GET /health`, `GET /ready`. All auth/todo endpoints are registered but currently return `501 NOT_IMPLEMENTED`. Their successful behaviors below are the target contract for the learning milestones.

## Success envelope

```json
{
  "success": true,
  "message": "Task created.",
  "data": {
    "todo": {
      "id": "c4ac819f-b466-47bf-8892-696a9d425c2e",
      "title": "Implement authentication",
      "description": "Start with the session repository.",
      "completed": false,
      "priority": "high",
      "dueDate": "2026-10-12",
      "createdAt": "2026-10-09T10:00:00.000Z"
    }
  },
  "meta": {
    "requestId": "425a7376-f42e-482e-bc3f-2ba248dc7eb9",
    "timestamp": "2026-10-09T10:00:00.000Z"
  }
}
```

Status lives in the HTTP response; do not duplicate it in the body. `message` is human-readable, not an application branching key. `data` is an object or null. `meta.requestId` matches `X-Request-Id`; timestamps are UTC ISO 8601 strings.

```js
return sendSuccess(res, {
  status: 201,
  message: "Task created.",
  data: { todo },
});
```

For logout and delete, use HTTP 200 with `data: null` so callers always receive a consistent envelope. Protocol-generated HEAD/OPTIONS responses can be bodyless; they are not resource responses.

## Error envelope

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [{ "field": "title", "message": "Title is required." }]
  },
  "meta": {
    "requestId": "425a7376-f42e-482e-bc3f-2ba248dc7eb9",
    "timestamp": "2026-10-09T10:00:00.000Z"
  }
}
```

`error.code` is stable and machine-readable. `error.details` is null unless safe validation issues are available. Never return SQL, stack traces, connection strings, tokens, raw submitted passwords or database driver details. Use static public messages in `ApiError` and custom Zod validators.

```js
throw new ApiError(404, "TODO_NOT_FOUND", "Task not found.");
```

Do not catch and resend every error inside a controller. Express 5 forwards rejected async handler promises to the final error middleware. Handle callback/event-emitter errors explicitly. If headers have already been sent, the handler delegates to Express; an envelope cannot safely replace a partially sent response.

## Status and error codes

| HTTP | Code                   | Meaning / implementation                              |
| ---- | ---------------------- | ----------------------------------------------------- |
| 400  | INVALID_JSON           | Malformed JSON, implemented                           |
| 401  | UNAUTHENTICATED        | Missing, expired or invalid session; feature task     |
| 401  | INVALID_CREDENTIALS    | Invalid email/password; feature task                  |
| 403  | ORIGIN_NOT_ALLOWED     | CORS origin rejected, implemented                     |
| 403  | CSRF_REJECTED          | Invalid mutation origin/token; feature task           |
| 404  | ROUTE_NOT_FOUND        | No matching route, implemented                        |
| 404  | TODO_NOT_FOUND         | Missing or other user's todo; feature task            |
| 409  | RESOURCE_CONFLICT      | PostgreSQL unique constraint violation, implemented   |
| 409  | EMAIL_IN_USE           | Optional explicit registration conflict; feature task |
| 413  | PAYLOAD_TOO_LARGE      | JSON body exceeds 16 KB, implemented                  |
| 415  | UNSUPPORTED_ENCODING   | Unsupported body encoding/charset, implemented        |
| 422  | VALIDATION_ERROR       | Zod validation failure, implemented                   |
| 422  | INVALID_DATA           | Safe database constraint/input error, implemented     |
| 429  | RATE_LIMITED           | Feature task; include Retry-After header              |
| 500  | INTERNAL_ERROR         | Unexpected failure, implemented; generic message      |
| 501  | NOT_IMPLEMENTED        | Registered feature stub, implemented                  |
| 503  | DEPENDENCY_UNAVAILABLE | PostgreSQL/Redis unavailable, implemented             |
| 503  | DATABASE_TIMEOUT       | PostgreSQL statement timeout, implemented             |
| 503  | SHUTTING_DOWN          | Readiness during shutdown, implemented                |

Do not retry POST/PATCH/DELETE automatically: network failure does not prove the server did not commit a write. Add idempotency design before automatic mutation retries.

## Health endpoints

| Endpoint    | Success `data`                                                 | Failure                                               |
| ----------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| GET /health | `{ "status": "ok" }`                                           | Indicates process liveness only                       |
| GET /ready  | `{ "status": "ready", "postgres": "up", "redis": "disabled" }` | 503 if required dependencies fail or shutdown started |

When enabled and connected, Redis is reported as `"up"`. No credentials or database version are exposed. Do not use dependency readiness as a liveness probe.

## Auth endpoints — learning tasks

Safe `User`: `{ "id": "uuid", "name": "Alex", "email": "alex@example.com" }`.

| Method/path         | Request body                                                                 | Target status / `data`                        |
| ------------------- | ---------------------------------------------------------------------------- | --------------------------------------------- |
| POST /auth/register | `{ "name": "Alex", "email": "alex@example.com", "password": "password123" }` | 201 / `{ "user": User }` + cookie; auto-login |
| POST /auth/login    | `{ "email": "alex@example.com", "password": "password123" }`                 | 200 / `{ "user": User }` + fresh cookie       |
| GET /auth/me        | None                                                                         | 200 / `{ "user": User }`, otherwise 401       |
| POST /auth/logout   | None                                                                         | 200 / null; revoke session and clear cookie   |

Trim name to 2–80 characters. Normalize email consistently. Reject unknown fields. For bcrypt, require passwords of at least 8 characters and no more than 72 UTF-8 bytes. Never truncate passwords silently. Use a generic invalid-credentials response for login.

Session target: generate 32 random bytes; persist only a SHA-256 token hash with user ID and expiry. Send the raw token only in an HttpOnly cookie with `SameSite=Lax`, `Path=/`, secure in production, and matching expiry. Clear the same cookie path/domain options at logout. Session expiration is checked server-side. Logout may succeed idempotently if the session has already expired.

## Todo endpoints — learning tasks

Todo fields: `id`, `title`, `description`, `completed`, `priority`, `dueDate`, `createdAt` as shown in the success example.

| Method/path       | Request                                              | Target status / `data`                         |
| ----------------- | ---------------------------------------------------- | ---------------------------------------------- |
| GET /todos        | None                                                 | 200 / `{ "todos": Todo[] }`                    |
| POST /todos       | `{title, description, completed, priority, dueDate}` | 201 / `{ "todo": Todo }`                       |
| PATCH /todos/:id  | At least one allowed editable field                  | 200 / `{ "todo": Todo }` (full updated object) |
| DELETE /todos/:id | None                                                 | 200 / null                                     |

Validation: title trimmed, 1–160 characters; description <=2,000; completed boolean; priority `low|medium|high`; dueDate null or a real calendar date `YYYY-MM-DD`; ID a UUID. Reject unknown fields including `userId` and `createdAt`.

Ownership: derive the owner from the authenticated session. Every lookup/update/delete is constrained by both ID and owner ID. Other users' IDs return the same 404 as missing IDs. SQL column names for PATCH must come from a fixed allowlist; parameterize all values.

The current frontend filters the complete returned list locally. Pagination is a future contract/UI change; do not silently return only page one. Suggested future metadata: `meta.pagination = { cursor, nextCursor, hasMore }` with explicit cursor query parameters and matching frontend loading behavior.

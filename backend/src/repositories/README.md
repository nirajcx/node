# Repositories — learning layer

| File                  | Intended methods                                         |
| --------------------- | -------------------------------------------------------- |
| user.repository.js    | create, findByEmail, findById and safe public mapping    |
| session.repository.js | create, findUnexpiredByHash, revoke, removeExpired       |
| todo.repository.js    | listByUser, create, updateByIdAndUser, deleteByIdAndUser |

Use injected database/client adapters and parameterized `$1` values. Never interpolate request-controlled SQL identifiers. PATCH column names come from a fixed allowlist. Every todo query scopes by user_id; mutation queries use `WHERE id = $1 AND user_id = $2 RETURNING ...`.

Map snake_case rows to the API's camelCase DTOs. Preserve due_date as YYYY-MM-DD; created_at becomes an ISO UTC timestamp. Use the supplied transaction client for every statement within an atomic operation.

Acceptance: test missing rows, uniqueness, rollback, invalid constraints and cross-user access in a separate database.

# Services — learning layer

`auth.service.js`: registration/login rules, password hashing, session creation/revocation and safe user results.
`todo.service.js`: todo rules and repository orchestration.

Services accept plain input plus the authenticated actor ID and depend on repositories/database adapters, not Express req/res. Choose transaction boundaries here when multiple writes must succeed atomically. Throw `ApiError` with safe static public messages for expected failures; unexpected errors propagate unchanged to the boundary.

Acceptance: unit tests cover domain decisions; database tests cover atomicity. Do not hold a DB transaction while waiting on unrelated external HTTP calls.

# Input validators — learning layer

`auth.schema.js` defines strict register/login bodies. Normalize email, trim names, enforce lengths and password UTF-8 byte limits.
`todo.schema.js` defines strict create/patch bodies and UUID params. Reject empty patches and unknown fields. Validate actual calendar dates, not only a regex. Never accept userId, createdAt or other server-owned properties.

Use `validate(schema, 'body'|'params'|'query')`. Parsed/normalized values are available in `res.locals.validated`. Custom error messages must not echo submitted passwords or sensitive input. Enforce critical invariants again using database constraints.

Acceptance: boundary values, whitespace, type mismatches, unknown fields, leap dates and partial updates are tested.

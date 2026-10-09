# Shared utilities

- `ApiError.js`: expected public failure with status, stable code and safe message/details. Do not include SQL or secrets.
- `response.js`: the only success/failure JSON builders. Metadata includes server request ID and ISO timestamp.
- `notImplemented.js`: explicit 501 for learning placeholders.
- `session.js`: remaining exercise for cryptographic tokens, token hashing and consistent cookie options.

Controllers call sendSuccess; errors are thrown and reach the middleware. sendError belongs at the boundary, including future rate-limit handlers that require direct responses. Avoid a second error format or exporting a global stateful singleton from this directory.

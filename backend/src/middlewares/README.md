# Middleware

Implemented:

- `requestContext.middleware.js`: generates a request UUID, exposes X-Request-Id, disables response caching and emits safe completion logs.
- `validate.middleware.js`: parses a schema into `res.locals.validated.body|params|query` without mutating Express 5's query getter.
- `notFound.middleware.js`: turns unmatched requests into a standard 404 error.
- `error.middleware.js`: normalizes known errors, hides unexpected details and emits the canonical failure envelope.

Learning tasks:

- `auth.middleware.js`: verify hashed, unexpired sessions and assign server-derived `req.user`.
- `csrf.middleware.js`: protect cookie-authenticated mutations; define missing-origin/non-browser policy and cross-site token needs.
- `rateLimit.middleware.js`: enforce documented route limits with standard 429 responses, Retry-After and a shared store when using multiple replicas.

The error handler must remain last and retain four arguments `(error, req, res, next)`. CORS and authentication are separate controls; CORS is not a complete CSRF defense. Implement these gates before enabling feature routes.

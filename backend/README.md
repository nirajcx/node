# Dayflow API

A Node.js/Express 5 backend foundation for a PostgreSQL-backed todo application. Infrastructure is implemented; authentication, todo business logic and application migrations remain deliberate learning exercises.

**Deployment status: not ready for public production traffic.** A production-oriented foundation is not a completed production application. See the [release checklist](docs/OPERATIONS.md#release-checklist) before deployment.

## What is implemented

| Capability                                                                 | Status                                                         |
| -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Validated environment and configurable bind address                        | Implemented                                                    |
| PostgreSQL pool, connection check, bounded queries, transactions, shutdown | Implemented; a working local database URL is required          |
| Optional Redis connection lifecycle                                        | Implemented, disabled by default; no cache/session feature yet |
| Consistent JSON success/error envelopes                                    | Implemented                                                    |
| Request IDs, structured redacted logging, no-store headers                 | Implemented                                                    |
| Centralized Express error handler and 404 handler                          | Implemented                                                    |
| JSON parsing limits, Helmet, exact-origin credentialed CORS                | Implemented                                                    |
| Reusable Zod validation middleware                                         | Implemented; feature schemas remain exercises                  |
| Liveness and dependency readiness probes                                   | Implemented                                                    |
| Graceful HTTP/database/Redis shutdown and startup failure behavior         | Implemented                                                    |
| Authentication, authorization, cookies, CSRF, rate limits                  | Learning tasks; not implemented                                |
| Todo CRUD, schema migrations, repositories                                 | Learning tasks; all feature routes return 501                  |

## Requirements

- Node.js 22.9+ (Node 24 LTS is suitable).
- npm; use `npm ci` for a reproducible install from the lockfile.
- Reachable PostgreSQL and a dedicated development database/login.
- Redis only when `REDIS_ENABLED=true`.

## Quick start

Run from `backend/`:

```sh
npm ci
# Only on a fresh checkout. Keep an existing configured .env.
cp -n .env.example .env
# Edit DATABASE_URL in .env using your local PostgreSQL credentials.
npm run db:check
npm run dev
```

The server checks PostgreSQL **before listening**. It exits unsuccessfully if the database is unreachable or credentials are invalid. It does not create databases, roles, tables or migrations automatically.

For an existing PostgreSQL instance, ask its administrator to create a dedicated database/login if necessary. Do not reuse another application's account or database. A local development owner role is convenient for learning migrations; production runtime and migration roles should be separate.

Example URL (replace the password; URL-encode special characters):

```dotenv
DATABASE_URL=postgresql://dayflow_app:replace_me@localhost:5432/dayflow
```

Verify the running API:

```sh
curl -i http://localhost:4000/api/health
curl -i http://localhost:4000/api/ready
curl -i http://localhost:4000/api/todos
```

Expect 200 for liveness/readiness when dependencies are healthy; `/api/todos` intentionally returns 501 until implemented.

## Complete backend structure

```text
backend/
├── .env.example                      # Documented configuration; no real secrets
├── .env                              # Local-only credentials; ignored by Git
├── package.json                      # Commands, engines, bounded dependency versions
├── package-lock.json                 # Reproducible dependency graph
├── README.md                         # Entry point and complete structure
├── IMPLEMENTATION.md                 # Implementation order and definition of done
├── docs/
│   ├── README.md                     # Documentation index
│   ├── API.md                        # Exact request/response contract
│   ├── ARCHITECTURE.md               # Layer boundaries and request lifecycle
│   ├── CONFIGURATION.md              # Environment reference and local setup
│   ├── LEARNING.md                   # Ordered exercises and acceptance criteria
│   ├── OPERATIONS.md                 # Startup, probes, shutdown, security, release gates
│   └── REDIS.md                      # Optional lifecycle and future integration design
├── db/
│   ├── README.md                     # Database and role conventions
│   └── migrations/
│       ├── README.md                 # Schema design and migration workflow exercise
│       └── 001_initial.sql           # Placeholder; intentionally no application DDL
├── scripts/
│   ├── README.md                     # Operational script contracts
│   ├── check-db.js                   # Read-only connectivity check with pool cleanup
│   └── check-syntax.js               # Syntax validation for all backend JavaScript
├── src/
│   ├── README.md                     # Source navigation
│   ├── app.js                        # Injectable Express factory; no listening side effect
│   ├── server.js                     # Composition, dependency startup, HTTP, shutdown
│   ├── config/
│   │   ├── README.md
│   │   ├── env.js                    # Zod environment parsing
│   │   ├── db.js                     # pg pool, query, ping, transaction, close
│   │   ├── redis.js                  # Optional Redis lifecycle, bounded health check
│   │   └── logger.js                 # JSON logs and safe error summaries
│   ├── routes/
│   │   ├── README.md
│   │   ├── auth.routes.js            # Auth endpoints; 501 stubs
│   │   └── todo.routes.js            # Todo endpoints; 501 stubs
│   ├── controllers/
│   │   ├── README.md
│   │   ├── auth.controller.js        # TODO: HTTP/session cookie translation
│   │   └── todo.controller.js        # TODO: HTTP todo translation
│   ├── services/
│   │   ├── README.md
│   │   ├── auth.service.js           # TODO: registration, login and session rules
│   │   └── todo.service.js           # TODO: todo business rules
│   ├── repositories/
│   │   ├── README.md
│   │   ├── user.repository.js        # TODO: parameterized user queries
│   │   ├── session.repository.js     # TODO: hashed session persistence
│   │   └── todo.repository.js        # TODO: owner-scoped todo queries
│   ├── middlewares/
│   │   ├── README.md
│   │   ├── requestContext.middleware.js # Request ID, response headers, access log
│   │   ├── validate.middleware.js    # Parsed input in res.locals.validated
│   │   ├── notFound.middleware.js    # Standard ROUTE_NOT_FOUND error
│   │   ├── error.middleware.js       # Public error normalization and response
│   │   ├── auth.middleware.js        # TODO: valid session → req.user
│   │   ├── csrf.middleware.js        # TODO: mutation CSRF protection
│   │   └── rateLimit.middleware.js   # TODO: authentication/route limits
│   ├── validators/
│   │   ├── README.md
│   │   ├── auth.schema.js            # TODO: strict registration/login schemas
│   │   └── todo.schema.js            # TODO: strict body/UUID/date schemas
│   └── utils/
│       ├── README.md
│       ├── ApiError.js               # Explicit public HTTP error
│       ├── response.js               # Canonical success/error envelopes
│       ├── notImplemented.js         # Explicit 501 feature placeholder
│       └── session.js                # TODO: secure token/hash/cookie helpers
└── tests/
    ├── README.md                     # Test policy, isolation and coverage
    ├── unit/
    │   ├── README.md
    │   └── foundation.test.js         # Configuration, errors, validation, transactions
    └── integration/
        ├── README.md
        ├── redis.test.js             # Bounded handshake failure with disposable TCP server
        ├── startup.test.js           # Fatal startup/configuration failure behavior
        ├── http.test.js              # HTTP envelopes, probes, CORS, parser errors
        └── database.test.js          # Opt-in real PostgreSQL connectivity/transactions
```

## Commands

| Command                | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run dev`          | Watch mode; reads `.env`; requires working dependencies              |
| `npm start`            | Runs server; reads `.env` if present, or uses injected environment   |
| `npm run check`        | Syntax-checks source, scripts and tests                              |
| `npm test`             | Unit + HTTP integration tests; no PostgreSQL/Redis required          |
| `npm run db:check`     | Real, read-only PostgreSQL connection verification                   |
| `npm run test:db`      | Real DB tests; temporary transaction table only, no application data |
| `npm audit --omit=dev` | Inspect production dependency advisories                             |

## How to continue

1. Read [architecture](docs/ARCHITECTURE.md) and the [API contract](docs/API.md).
2. Follow the numbered [learning milestones](docs/LEARNING.md).
3. Keep the response helpers and error boundary in place while replacing stubs.
4. Implement security and ownership tests before exposing real routes.
5. Switch the frontend to real mode only after the contract works end to end.

## Frontend integration

The frontend's Axios client and demo adapter use the same response envelope. In `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_DEMO_MODE=false
```

Restart Next.js after changing public environment values; production builds require a rebuild. Real mode currently receives expected 501 responses. Demo mode remains enabled for UI development until feature implementation is complete.

## References

- [Express error handling](https://expressjs.com/en/guide/error-handling/)
- [node-postgres pooling](https://node-postgres.com/features/pooling)
- [node-postgres transactions](https://node-postgres.com/features/transactions)
- [Node Redis connection guide](https://redis.io/docs/latest/develop/clients/nodejs/connect/)

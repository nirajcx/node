# Configuration and local infrastructure

The server uses Node's native environment-file support. Existing process environment variables take precedence. `npm run dev` requires `.env`; `npm start` permits an absent file for production secret injection. `loadEnv` validates without printing supplied values.

## Environment reference

| Variable                       | Default / required         | Purpose                                                        |
| ------------------------------ | -------------------------- | -------------------------------------------------------------- |
| NODE_ENV                       | development                | development, test or production                                |
| HOST                           | 127.0.0.1                  | Loopback by default; explicitly use 0.0.0.0 inside a container |
| PORT                           | 4000                       | HTTP port, 1–65535                                             |
| FRONTEND_URL                   | Required                   | Exact HTTP(S) origin, no path/trailing slash                   |
| DATABASE_URL                   | Required                   | PostgreSQL URL; percent-encode password special characters     |
| DB_SSL                         | false                      | Explicit true/false TLS flag                                   |
| DB_SSL_CA_FILE                 | Unset                      | Optional CA bundle when TLS is enabled                         |
| DB_POOL_MAX                    | 10                         | Connections per process, 1–100                                 |
| DB_CONNECT_TIMEOUT_MS          | 5000                       | Pool acquisition/connect timeout                               |
| DB_IDLE_TIMEOUT_MS             | 30000                      | Idle pooled connection lifetime                                |
| DB_STATEMENT_TIMEOUT_MS        | 5000                       | PostgreSQL server statement timeout                            |
| DB_QUERY_TIMEOUT_MS            | 6000                       | Client query deadline; must exceed statement timeout           |
| DB_IDLE_TRANSACTION_TIMEOUT_MS | 10000                      | Limits abandoned idle transactions                             |
| SHUTDOWN_TIMEOUT_MS            | 10000                      | Maximum graceful shutdown window                               |
| REDIS_ENABLED                  | false                      | Opt-in Redis lifecycle/readiness dependency                    |
| REDIS_URL                      | Required only when enabled | redis:// or rediss:// URL                                      |
| REDIS_CONNECT_TIMEOUT_MS       | 3000                       | Connect and ping deadline                                      |
| SESSION_COOKIE_NAME            | dayflow_session            | Reserved for auth implementation                               |
| SESSION_TTL_DAYS               | 7                          | Reserved for auth implementation, 1–30                         |
| LOG_LEVEL                      | info                       | fatal, error, warn, info, debug, trace, silent                 |

## PostgreSQL connection

Provide a dedicated local database and login, then set `DATABASE_URL`. Run `npm run db:check` before starting the API. No schemas are created on startup. The `db/migrations/001_initial.sql` file is intentionally a placeholder.

Use `localhost` consistently between frontend and backend to avoid cookie-origin confusion. For Docker-hosted PostgreSQL, use its published host port when running Node on the host; use the Compose service hostname only when Node is on the same Docker network. A published database port is not proof that the expected database or credentials exist.

For production TLS, set `DB_SSL=true`. Add a trusted CA file if your provider requires one. The client uses `rejectUnauthorized: true`; never bypass certificate verification. SSL connection-string query parameters are rejected to prevent them from overriding this policy. Choose TLS according to the deployment's network and database requirements.

Pool budgeting: `replicas × DB_POOL_MAX`, plus migration/admin capacity, must fit the database connection limit. Ten connections is a starting default, not a universal production value.

## Secrets

- Commit `.env.example`, never `.env`.
- Keep local credentials out of documentation, shell history, screenshots and logs.
- Production uses a secret manager or runtime environment injection.
- Use separate development/test/production databases.
- Production runtime roles should not own schema or have migration privileges.

## Troubleshooting

| Symptom                           | Check                                                           |
| --------------------------------- | --------------------------------------------------------------- |
| Invalid environment configuration | Required fields, exact booleans, URLs and timeout relationships |
| ECONNREFUSED                      | PostgreSQL is running and host/port are correct                 |
| PostgreSQL 28P01                  | Username/password and authentication configuration              |
| PostgreSQL 3D000                  | The configured database exists                                  |
| TLS failure                       | Hostname, trusted CA and explicit TLS settings                  |
| EADDRINUSE                        | Another process owns the HTTP port; use a free PORT             |
| 503 readiness                     | Dependency availability, current logs and Redis enabled setting |
| 501 auth/todo                     | Expected until the learning milestones are implemented          |
| CORS failure                      | Browser origin exactly matches FRONTEND_URL                     |

Error logs intentionally omit raw connection strings and SQL. Correlate request errors through `X-Request-Id` and the JSON log `requestId`.

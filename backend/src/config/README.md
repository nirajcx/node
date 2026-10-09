# Infrastructure configuration

| File      | Responsibility                                                                   |
| --------- | -------------------------------------------------------------------------------- |
| env.js    | Parse and validate environment once; return immutable config                     |
| db.js     | One pg pool per process; bounded queries; same-client transactions; DATE strings |
| redis.js  | Disabled-by-default Redis lifecycle; no cache/business feature                   |
| logger.js | Structured JSON logs; redaction; safe error summaries                            |

Factories receive explicit config and logger dependencies. They never read request data. Use `database.query(sql, params)` for a single statement and `database.transaction(work)` for atomic work. Always use the callback client inside a transaction. Startup/shutdown orchestration belongs in server.js.

See [configuration](../../docs/CONFIGURATION.md) for every environment variable. Never bypass TLS certificate validation to fix a connection problem.

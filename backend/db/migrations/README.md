# Schema migrations — learning milestone

`001_initial.sql` is a placeholder, not an executed migration. Write and review the initial schema:

| Table    | Required design                                                                                                                                                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| users    | UUID PK, name varchar(80), normalized lowercase email UNIQUE NOT NULL, password_hash NOT NULL, created_at timestamptz                                                                                                                                      |
| sessions | UUID PK, user_id FK users ON DELETE CASCADE, token_hash UNIQUE NOT NULL, expires_at and created_at timestamptz                                                                                                                                             |
| todos    | UUID PK, user_id FK users ON DELETE CASCADE, nonblank title varchar(160), description text default empty (max 2000 constraint), completed boolean default false, priority CHECK low/medium/high, due_date date nullable, created_at/updated_at timestamptz |

Use explicit NOT NULL constraints, length/check constraints, and indexes on owner/creation order and session owner/expiry. Set updated_at on every patch. Decide whether IDs are generated with Node crypto.randomUUID or a PostgreSQL default and use one consistent approach.

For learning, a completed initial SQL file can be applied manually with psql to a clean development database. For release use, implement a migration history table, ordered versions, checksums, concurrency locking and atomic execution where supported. Never edit an already-applied migration; add a new version. Avoid destructive rollbacks on live data; use reviewed forward fixes and backups.

The server must not run migrations on each replica startup. CI should create a disposable test database, apply the full migration history and exercise repository behavior.

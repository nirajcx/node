# Database assets

Connection infrastructure is implemented in `src/config/db.js`. This directory is for version-controlled schema migrations, not runtime connection code or database dumps.

The application never automatically creates a database, role or tables. Configure a dedicated development database first. `migrations/001_initial.sql` is intentionally empty except for its learning note.

Use separate local/test/production databases. Production migration credentials own DDL; runtime credentials have only necessary data permissions. Keep backups outside source control and test restores. See [migration instructions](migrations/README.md).

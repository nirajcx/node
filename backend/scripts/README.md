# Operational scripts

`check-db.js` validates configuration, performs SELECT 1 and closes the pool in finally. It does not create or migrate a database. Run `npm run db:check` with backend/.env configured.

`check-syntax.js` recursively checks JavaScript in source/scripts/tests using node --check and sets a failing exit code on errors. It does not execute application logic.

Scripts must close resources, return meaningful exit codes and avoid logging credentials. Add a migration command only after choosing and testing the versioned migration workflow.

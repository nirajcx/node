# Unit tests

`foundation.test.js` covers environment parsing/secret-safe failures, error normalization, reusable validation, disabled Redis behavior and transaction commit/rollback/release. Database clients are explicit fakes; no external services are required.

Add isolated service/schema tests here as features are implemented. Test behavior and invariants rather than duplicating implementation line by line.

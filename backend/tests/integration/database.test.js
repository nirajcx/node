import test from "node:test";
import assert from "node:assert/strict";
import { loadEnv } from "../../src/config/env.js";
import { createLogger } from "../../src/config/logger.js";
import { createDatabase } from "../../src/config/db.js";

// Explicit opt-in command (npm run test:db). No application tables or real user data.
test("real PostgreSQL connection, date serialization, transaction rollback and reuse", async () => {
  const config = loadEnv();
  const database = createDatabase(config, createLogger(config));
  try {
    await database.ping();
    const result = await database.query(
      "SELECT $1::text AS value, DATE '2026-10-09' AS due_date",
      ["parameterized"],
    );
    assert.equal(result.rows[0].value, "parameterized");
    assert.equal(result.rows[0].due_date, "2026-10-09");
    await database.transaction(async (client) => {
      await client.query(
        "CREATE TEMP TABLE dayflow_connection_test (id integer) ON COMMIT DROP",
      );
      await client.query(
        "INSERT INTO dayflow_connection_test VALUES ($1)",
        [1],
      );
      const row = await client.query("SELECT id FROM dayflow_connection_test");
      assert.equal(row.rows[0].id, 1);
    });
    await assert.rejects(
      database.transaction((client) => client.query("SELECT 1 / 0")),
      (error) => error.code === "22012",
    );
    await database.ping();
  } finally {
    await database.close();
  }
});

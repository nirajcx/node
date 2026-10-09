import { readFileSync } from "node:fs";
import pg from "pg";
import { safeError } from "./logger.js";

// PostgreSQL DATE represents a calendar date; preserve it without timezone conversion.
pg.types.setTypeParser(1082, (value) => value);

export function createDatabase(config, logger) {
  const pool = new pg.Pool({
    connectionString: config.DATABASE_URL,
    application_name: "dayflow-api",
    max: config.DB_POOL_MAX,
    connectionTimeoutMillis: config.DB_CONNECT_TIMEOUT_MS,
    idleTimeoutMillis: config.DB_IDLE_TIMEOUT_MS,
    statement_timeout: config.DB_STATEMENT_TIMEOUT_MS,
    query_timeout: config.DB_QUERY_TIMEOUT_MS,
    idle_in_transaction_session_timeout: config.DB_IDLE_TRANSACTION_TIMEOUT_MS,
    ssl: config.DB_SSL
      ? {
          rejectUnauthorized: true,
          ...(config.DB_SSL_CA_FILE
            ? { ca: readFileSync(config.DB_SSL_CA_FILE, "utf8") }
            : {}),
        }
      : false,
  });
  pool.on("error", (error) =>
    logger.error({ error: safeError(error) }, "postgres_idle_client_error"),
  );
  return {
    query: (text, values) => pool.query(text, values),
    ping: async () => {
      await pool.query("SELECT 1");
    },
    transaction: (work) => withTransaction(pool, work),
    close: () => pool.end(),
  };
}

/** Transactions MUST use the same checked-out client for every query. */
export async function withTransaction(pool, work) {
  const client = await pool.connect();
  let discard = false;
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      discard = true;
    }
    throw error;
  } finally {
    // A client with a failed rollback must never return to the reusable pool.
    client.release(discard);
  }
}

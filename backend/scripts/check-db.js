import { loadEnv } from "../src/config/env.js";
import { createDatabase } from "../src/config/db.js";
import { createLogger, safeError } from "../src/config/logger.js";
const config = loadEnv();
const logger = createLogger(config);
const database = createDatabase(config, logger);
try {
  await database.ping();
  logger.info("database_connection_verified");
} catch (error) {
  logger.error({ error: safeError(error) }, "database_connection_failed");
  process.exitCode = 1;
} finally {
  await database.close();
}

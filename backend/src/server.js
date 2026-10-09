import { createServer } from "node:http";
import { loadEnv } from "./config/env.js";
import { createLogger, safeError } from "./config/logger.js";
import { createDatabase } from "./config/db.js";
import { createRedis } from "./config/redis.js";
import { createApp } from "./app.js";

async function main() {
  const config = loadEnv();
  const logger = createLogger(config);
  const database = createDatabase(config, logger);
  const redis = createRedis(config, logger);
  let shuttingDown = false;
  const app = createApp({
    config,
    logger,
    database,
    redis,
    isShuttingDown: () => shuttingDown,
  });
  const server = createServer(app);
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;

  async function shutdown(reason, exitCode = 0) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ reason }, "shutdown_started");
    const deadline = setTimeout(() => {
      logger.fatal("shutdown_deadline_exceeded");
      server.closeAllConnections();
      process.exit(1);
    }, config.SHUTDOWN_TIMEOUT_MS);
    try {
      await new Promise((resolve, reject) => {
        if (!server.listening) return resolve();
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeIdleConnections();
      });
      const results = await Promise.allSettled([
        redis.close(),
        database.close(),
      ]);
      if (results.some((result) => result.status === "rejected")) exitCode = 1;
    } catch (error) {
      logger.error({ error: safeError(error) }, "shutdown_failed");
      exitCode = 1;
    } finally {
      clearTimeout(deadline);
      logger.info({ exitCode }, "shutdown_completed");
      process.exitCode = exitCode;
    }
  }
  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.once("uncaughtException", (error) => {
    logger.fatal({ error: safeError(error) }, "uncaught_exception");
    void shutdown("uncaughtException", 1);
  });
  process.once("unhandledRejection", (error) => {
    logger.fatal({ error: safeError(error) }, "unhandled_rejection");
    void shutdown("unhandledRejection", 1);
  });
  try {
    await database.ping();
    if (shuttingDown) return;
    await redis.connect();
    if (shuttingDown) {
      await redis.close();
      return;
    }
    await redis.ping();
    if (shuttingDown) return;
    await new Promise((resolve, reject) => {
      const onListenError = (error) => reject(error);
      server.once("error", onListenError);
      server.listen(config.PORT, config.HOST, () => {
        server.removeListener("error", onListenError);
        resolve();
      });
    });
    logger.info(
      { host: config.HOST, port: config.PORT, redisEnabled: redis.enabled },
      "server_ready",
    );
    server.on("error", (error) => {
      logger.error({ error: safeError(error) }, "http_server_error");
      void shutdown("serverError", 1);
    });
  } catch (error) {
    logger.fatal({ error: safeError(error) }, "startup_failed");
    await shutdown("startupFailure", 1);
  }
}

main().catch(() => {
  // Do not print raw configuration/driver errors, which can include secrets.
  console.error(
    "Startup failed. Validate environment settings, TLS files and dependency availability.",
  );
  process.exitCode = 1;
});

import { createClient } from "redis";
import { safeError } from "./logger.js";

/** Optional infrastructure only. No todo cache, sessions or shared rate limiter yet. */
export function createRedis(config, logger) {
  if (!config.REDIS_ENABLED) {
    return {
      enabled: false,
      connect: async () => {},
      ping: async () => {},
      close: async () => {},
    };
  }
  const client = createClient({
    url: config.REDIS_URL,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: config.REDIS_CONNECT_TIMEOUT_MS,
      // Fail promptly; a supervisor restarts on startup failure. At runtime readiness
      // reports 503 after disconnect instead of silently accepting broken commands.
      reconnectStrategy: false,
    },
  });
  client.on("error", (error) =>
    logger.error({ error: safeError(error) }, "redis_client_error"),
  );
  async function withDeadline(operation) {
    let timer;
    try {
      return await Promise.race([
        operation(),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("Redis operation timed out")), config.REDIS_CONNECT_TIMEOUT_MS);
        }),
      ]);
    } catch (error) {
      // Dispose stalled sockets/queued commands; do not accumulate pending health pings.
      if (client.isOpen) client.destroy();
      throw error;
    } finally { clearTimeout(timer); }
  }
  return {
    enabled: true,
    connect: () => withDeadline(() => client.connect()),
    ping: async () => {
      if (!client.isReady) throw new Error("Redis is not ready");
      await withDeadline(() => client.ping());
    },
    close: async () => { if (client.isOpen) client.destroy(); },
  };
}

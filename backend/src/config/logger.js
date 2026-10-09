import pino from "pino";

export function createLogger(config) {
  return pino({
    level: config.LOG_LEVEL,
    base: { service: "dayflow-api", environment: config.NODE_ENV },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        "password",
        "passwordHash",
        "token",
        "authorization",
        "cookie",
        "DATABASE_URL",
        "REDIS_URL",
        "req.headers.authorization",
        "req.headers.cookie",
        "req.body",
        'res.headers["set-cookie"]',
      ],
      censor: "[REDACTED]",
    },
  });
}

// Intentionally omit raw driver messages, SQL, error detail, request bodies and URLs.
export function safeError(error) {
  return {
    type: error instanceof Error ? error.name : "UnknownError",
    code:
      typeof error?.code === "string" && /^[A-Z0-9_]{1,50}$/i.test(error.code)
        ? error.code
        : undefined,
  };
}

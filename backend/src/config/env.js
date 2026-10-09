import { z } from "zod";

const integer = (fallback, min, max) =>
  z.coerce.number().int().min(min).max(max).default(fallback);
const boolean = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");
const schema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    HOST: z.string().default("127.0.0.1"),
    PORT: integer(4000, 1, 65535),
    FRONTEND_URL: z
      .string()
      .url()
      .refine((value) => {
        if (!URL.canParse(value)) return false;
        const url = new URL(value);
        return (
          ["http:", "https:"].includes(url.protocol) && url.origin === value
        );
      }, "Must be an HTTP(S) origin without a trailing slash or path"),
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (value) =>
          URL.canParse(value) &&
          ["postgres:", "postgresql:"].includes(new URL(value).protocol),
        "Must be a PostgreSQL connection URL",
      ),
    DB_SSL: boolean,
    DB_SSL_CA_FILE: z.string().optional(),
    DB_POOL_MAX: integer(10, 1, 100),
    DB_CONNECT_TIMEOUT_MS: integer(5000, 100, 60000),
    DB_IDLE_TIMEOUT_MS: integer(30000, 1000, 600000),
    DB_STATEMENT_TIMEOUT_MS: integer(5000, 100, 60000),
    DB_QUERY_TIMEOUT_MS: integer(6000, 100, 120000),
    DB_IDLE_TRANSACTION_TIMEOUT_MS: integer(10000, 1000, 120000),
    SHUTDOWN_TIMEOUT_MS: integer(10000, 1000, 60000),
    REDIS_ENABLED: boolean,
    REDIS_URL: z.string().optional(),
    REDIS_CONNECT_TIMEOUT_MS: integer(3000, 100, 30000),
    SESSION_COOKIE_NAME: z
      .string()
      .regex(/^[A-Za-z0-9_-]+$/)
      .default("dayflow_session"),
    SESSION_TTL_DAYS: integer(7, 1, 30),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
  })
  .superRefine((env, ctx) => {
    if (env.REDIS_ENABLED) {
      try {
        if (!["redis:", "rediss:"].includes(new URL(env.REDIS_URL).protocol))
          throw new Error();
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["REDIS_URL"],
          message: "A valid Redis URL is required when Redis is enabled",
        });
      }
    }
    if (env.DB_QUERY_TIMEOUT_MS <= env.DB_STATEMENT_TIMEOUT_MS) {
      ctx.addIssue({
        code: "custom",
        path: ["DB_QUERY_TIMEOUT_MS"],
        message: "Must exceed DB_STATEMENT_TIMEOUT_MS",
      });
    }
    // Do not allow URL parameters to silently override the explicit TLS policy.
    const url = URL.canParse(env.DATABASE_URL)
      ? new URL(env.DATABASE_URL)
      : null;
    if (
      [...(url?.searchParams.keys() || [])].some((key) =>
        key.toLowerCase().startsWith("ssl"),
      )
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message:
          "Configure TLS with DB_SSL and DB_SSL_CA_FILE, not URL ssl parameters",
      });
    }
  });

export function loadEnv(source = process.env) {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    // Field names only: never include environment values or connection credentials.
    const fields = [
      ...new Set(parsed.error.issues.map((issue) => issue.path.join("."))),
    ];
    throw new Error(
      `Invalid environment configuration: ${fields.join(", ")}. See .env.example.`,
    );
  }
  return Object.freeze(parsed.data);
}

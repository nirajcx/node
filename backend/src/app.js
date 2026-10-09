import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import todoRoutes from "./routes/todo.routes.js";
import { requestContext } from "./middlewares/requestContext.middleware.js";
import { notFound } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { ApiError } from "./utils/ApiError.js";
import { sendSuccess } from "./utils/response.js";

/** Dependency injection keeps HTTP tests independent from real infrastructure. */
export function createApp({
  config,
  logger,
  database,
  redis,
  isShuttingDown = () => false,
}) {
  const app = express();
  app.disable("x-powered-by");
  // Leave trust proxy disabled until the deployment's exact proxy topology is known.
  app.use(requestContext(logger));
  app.use(helmet());
  app.use(
    cors({
      origin(origin, done) {
        if (!origin || origin === config.FRONTEND_URL) return done(null, true);
        return done(
          new ApiError(
            403,
            "ORIGIN_NOT_ALLOWED",
            "The request origin is not allowed.",
          ),
        );
      },
      credentials: true,
      exposedHeaders: ["X-Request-Id"],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    }),
  );
  app.use(express.json({ limit: "16kb" }));
  app.use(cookieParser());
  app.locals.database = database;
  app.locals.redis = redis;
  app.get("/api/health", (_req, res) =>
    sendSuccess(res, { message: "Process is alive.", data: { status: "ok" } }),
  );
  app.get("/api/ready", async (_req, res) => {
    if (isShuttingDown())
      throw new ApiError(503, "SHUTTING_DOWN", "The service is shutting down.");
    try {
      await Promise.all([database.ping(), redis.ping()]);
    } catch (cause) {
      throw new ApiError(
        503,
        "DEPENDENCY_UNAVAILABLE",
        "A required service is temporarily unavailable.",
        { cause },
      );
    }
    return sendSuccess(res, {
      message: "Dependencies are ready.",
      data: {
        status: "ready",
        postgres: "up",
        redis: redis.enabled ? "up" : "disabled",
      },
    });
  });
  app.use("/api/auth", authRoutes);
  app.use("/api/todos", todoRoutes);
  app.use(notFound);
  app.use(errorHandler(logger));
  return app;
}

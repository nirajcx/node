import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { sendError } from "../utils/response.js";
import { safeError } from "../config/logger.js";

export function normalizeError(error) {
  if (error instanceof ApiError) return error;
  if (error instanceof ZodError)
    return new ApiError(422, "VALIDATION_ERROR", "Request validation failed.", {
      details: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  if (error?.type === "entity.parse.failed")
    return new ApiError(
      400,
      "INVALID_JSON",
      "The request body must contain valid JSON.",
    );
  if (error?.type === "entity.too.large")
    return new ApiError(
      413,
      "PAYLOAD_TOO_LARGE",
      "The request body exceeds the 16 KB limit.",
    );
  if (["encoding.unsupported", "charset.unsupported"].includes(error?.type))
    return new ApiError(
      415,
      "UNSUPPORTED_ENCODING",
      "The request encoding is not supported.",
    );
  if (error?.code === "23505")
    return new ApiError(
      409,
      "RESOURCE_CONFLICT",
      "A resource with these details already exists.",
    );
  if (
    ["23503", "23514", "23502", "22P02", "22007", "22008"].includes(error?.code)
  )
    return new ApiError(
      422,
      "INVALID_DATA",
      "The supplied data violates a data constraint.",
    );
  if (
    [
      "ECONNREFUSED",
      "ECONNRESET",
      "ETIMEDOUT",
      "ENOTFOUND",
      "57P01",
      "57P02",
      "57P03",
      "53300",
      "08000",
      "08003",
      "08006",
    ].includes(error?.code)
  )
    return new ApiError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "A required service is temporarily unavailable.",
    );
  if (error?.code === "57014")
    return new ApiError(
      503,
      "DATABASE_TIMEOUT",
      "The database operation timed out. Please try again.",
    );
  return new ApiError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
}

export function errorHandler(logger) {
  // The four-argument signature is required by Express, even when req is unused.
  return (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    const normalized = normalizeError(error);
    const log =
      normalized.statusCode >= 500
        ? logger.error.bind(logger)
        : logger.warn.bind(logger);
    log(
      {
        requestId: res.locals.requestId,
        code: normalized.code,
        statusCode: normalized.statusCode,
        error: safeError(error),
      },
      "http_request_failed",
    );
    return sendError(res, {
      status: normalized.statusCode,
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
    });
  };
}

import { randomUUID } from "node:crypto";

export function requestContext(logger) {
  return (req, res, next) => {
    const start = performance.now();
    res.locals.requestId = randomUUID();
    res.setHeader("X-Request-Id", res.locals.requestId);
    res.setHeader("Cache-Control", "no-store");
    res.on("finish", () =>
      logger.info(
        {
          requestId: res.locals.requestId,
          method: req.method,
          // Matched template only: query strings and arbitrary user URLs are not logged.
          route: req.route?.path || "unmatched",
          statusCode: res.statusCode,
          durationMs: Math.round(performance.now() - start),
        },
        "http_request_completed",
      ),
    );
    next();
  };
}

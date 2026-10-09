function metadata(res, extra = {}) {
  return {
    ...extra,
    requestId: res.locals.requestId,
    timestamp: new Date().toISOString(),
  };
}

/** All successful JSON responses use this envelope. Prefer 200 with data:null over 204. */
export function sendSuccess(
  res,
  {
    status = 200,
    message = "Request completed successfully.",
    data = null,
    meta = {},
  } = {},
) {
  if (
    !Number.isInteger(status) ||
    status < 200 ||
    status > 299 ||
    [204, 205].includes(status)
  )
    throw new TypeError("Success envelopes require a body-bearing 2xx status");
  return res
    .status(status)
    .json({ success: true, message, data, meta: metadata(res, meta) });
}

/** Only boundary middleware should call this helper. Details must contain safe field errors only. */
export function sendError(
  res,
  {
    status = 500,
    code = "INTERNAL_ERROR",
    message = "An unexpected error occurred.",
    details = null,
  } = {},
) {
  if (!Number.isInteger(status) || status < 400 || status > 599)
    throw new TypeError("Error envelopes require a 4xx or 5xx status");
  return res
    .status(status)
    .json({
      success: false,
      data: null,
      error: { code, message, details },
      meta: metadata(res),
    });
}

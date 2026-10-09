import { ApiError } from "../utils/ApiError.js";
export function notFound(_req, _res, next) {
  next(
    new ApiError(
      404,
      "ROUTE_NOT_FOUND",
      "The requested endpoint does not exist.",
    ),
  );
}

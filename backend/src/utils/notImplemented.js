import { ApiError } from "./ApiError.js";
export function notImplemented() {
  throw new ApiError(
    501,
    "NOT_IMPLEMENTED",
    "This feature has not been implemented yet.",
  );
}

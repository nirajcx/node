export class ApiError extends Error {
  constructor(statusCode, code, message, { details = null, cause } = {}) {
    super(message, { cause });
    if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) {
      throw new TypeError("ApiError statusCode must be between 400 and 599");
    }
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

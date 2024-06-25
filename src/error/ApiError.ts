export class ApiError extends Error {
  code: number;
  status: string;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.status = code >= 400 && code < 500 ? "fail" : "error";
  }

  static badRequest(msg: string = "Bad Request") {
    return new ApiError(400, msg);
  }

  static unauthorized(msg: string = "Authentication Failed") {
    return new ApiError(401, msg);
  }

  static forbidden(msg: string = "Forbidden") {
    return new ApiError(403, msg);
  }

  static notFound(msg: string) {
    return new ApiError(404, msg);
  }

  static internal(msg: string) {
    return new ApiError(500, msg);
  }
}

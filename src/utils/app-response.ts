import { FastifyReply, FastifyRequest } from "fastify";

export enum StatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export class AppResponse {
  static sendSuccessResponse(
    request: FastifyRequest,
    reply: FastifyReply,
    statusCode: StatusCode,
    message: string,
    data: any = null
  ) {
    const executionStart =
      Number(request.headers["x-request-start"]) || Date.now();
    const executionTime = Date.now() - executionStart;

    const ip = Array.isArray(request.headers["x-forwarded-for"])
      ? request.headers["x-forwarded-for"][0]
      : request.headers["x-forwarded-for"] || request.ip || "unknown";

    return reply.status(statusCode).send({
      status_code: statusCode,
      message,
      data,
      metadata: {
        method: request.method,
        url: request.url,
        execution_time_ms: executionTime,
        ip,
        timestamp: new Date().toISOString(),
      },
    });
  }

  static sendSuccessNoDataResponse(
    request: FastifyRequest,
    reply: FastifyReply,
    statusCode: StatusCode,
    message: string
  ) {
    const executionStart =
      Number(request.headers["x-request-start"]) || Date.now();
    const executionTime = Date.now() - executionStart;

    const ip = Array.isArray(request.headers["x-forwarded-for"])
      ? request.headers["x-forwarded-for"][0]
      : request.headers["x-forwarded-for"] || request.ip || "unknown";

    return reply.status(statusCode).send({
      status_code: statusCode,
      message,
      metadata: {
        method: request.method,
        url: request.url,
        execution_time_ms: executionTime,
        ip,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

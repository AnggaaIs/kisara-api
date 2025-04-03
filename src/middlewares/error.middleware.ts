import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../utils/logger.util";
import { ValidatorService } from "../services/validator.service";
import { FastifySchemaValidationError } from "fastify/types/schema";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorNotFoundHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const executionStart = request.headers["x-request-start"]
    ? Number(request.headers["x-request-start"])
    : Date.now();
  const executionTime = Date.now() - executionStart;

  const ip = Array.isArray(request.headers["x-forwarded-for"])
    ? request.headers["x-forwarded-for"][0]
    : request.headers["x-forwarded-for"] || request.ip || "unknown";

  const statusCode = 404;
  const message = "Not Found";

  logger.error(
    `[${request.method}] ${request.url} - ${statusCode}: ${message} (Execution Time: ${executionTime}ms, IP: ${ip})`
  );

  const response = {
    status_code: statusCode,
    message,
    metadata: {
      method: request.method,
      url: request.url,
      execution_time_ms: executionTime,
      ip,
      timestamp: new Date().toISOString(),
    },
  };

  reply.status(statusCode).send(response);
};

export const errorHandler = (
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const statusCode = (error as AppError).statusCode || 500;
  const message = error.message || "Internal Server Error";

  const executionStart = request.headers["x-request-start"]
    ? Number(request.headers["x-request-start"])
    : Date.now();
  const executionTime = Date.now() - executionStart;

  const ip = Array.isArray(request.headers["x-forwarded-for"])
    ? request.headers["x-forwarded-for"][0]
    : request.headers["x-forwarded-for"] || request.ip || "unknown";

  if ("validation" in error) {
    if (error.validation?.length !== 0) {
      const errors = ValidatorService.validate(
        error.validation as FastifySchemaValidationError[],
        request.body
      );

      logger.error(
        { err: errors },
        `Validation error on ${request.method} ${request.url}:`
      );

      return reply.status(400).send({
        status_code: 400,
        message: "Validation Error",
        errors,
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

  logger.error(
    `[${request.method}] ${request.url} - ${statusCode}: ${message} (Execution Time: ${executionTime}ms, IP: ${ip})`
  );
  logger.error(
    { err: error },
    `Error occurred on ${request.method} ${request.url}:`
  );

  const response = {
    status_code: statusCode,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    metadata: {
      method: request.method,
      url: request.url,
      execution_time_ms: executionTime,
      ip,
      timestamp: new Date().toISOString(),
    },
  };

  reply.status(statusCode).send(response);
};

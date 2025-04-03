import pino, { LoggerOptions } from "pino";
import { FastifyBaseLogger } from "fastify";
import { environment } from "../config/environment";
import fs from "fs";
import path from "path";
import { hostname } from "os";

interface HttpRequestLogParams {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

export interface Logger extends FastifyBaseLogger {
  httpRequest(params: HttpRequestLogParams): void;
}

const logDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const loggerOptions: LoggerOptions = {
  level: environment.nodeEnv === "production" ? "info" : "debug",
  base: {
    pid: process.pid,
    hostname: hostname(),
    env: environment.nodeEnv,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport:
    environment.nodeEnv !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : {
          targets: [
            {
              target: "pino/file",
              options: { destination: path.join(logDir, "app.log") },
              level: "info",
            },
            {
              target: "pino/file",
              options: { destination: path.join(logDir, "error.log") },
              level: "error",
            },
          ],
        },
};

const baseLogger = pino(loggerOptions) as unknown as Logger;

baseLogger.httpRequest = function (params: HttpRequestLogParams): void {
  this.info({ type: "http_request", ...params });
};

export const logger: Logger = baseLogger;

export default logger;

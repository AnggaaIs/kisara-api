import Fastify, { FastifyBaseLogger, FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit, { RateLimitOptions } from "@fastify/rate-limit";
import { environment } from "./config/environment";
import { AuthRoutes } from "./router/auth.routes";
import { UserRoutes } from "./router/user.routes";
import { MessageRoutes } from "./router/message.routes";
import { HomeRoutes } from "./router/home.routes";
import {
  errorHandler,
  errorNotFoundHandler,
} from "./middlewares/error.middleware";
import { AuthController } from "./controllers/auth.controller";
import { UserController } from "./controllers/user.controller";
import { MessageController } from "./controllers/message.controller";
import { logger } from "./utils/logger.util";
import { HomeController } from "./controllers/home.controller";
import { registerApiDocs } from "./config/api-docs";

export class FastifyApp {
  public readonly app: FastifyInstance;
  private readonly globalRateLimit: RateLimitOptions = {
    max: 100,
    timeWindow: "1 minute",
  };

  constructor() {
    // NOTE on trustProxy:
    // Currently disabled because Cloudflare is in DNS-only mode (not a reverse proxy).
    // req.ip already returns the real client IP (accurate).
    //
    // If you switch Cloudflare to proxy mode (orange cloud) or add a reverse proxy/load balancer,
    // enable it: trustProxy: true (or 1, 'uniquelocal', etc based on your proxy setup)
    this.app = Fastify({ loggerInstance: logger as FastifyBaseLogger });
  }

  public async setupPlugins() {
    await registerApiDocs(this.app);

    await this.app.register(cors, {
      origin: environment.cors.origin,
      methods: environment.cors.methods,
      allowedHeaders: environment.cors.allowedHeaders,
    });

    await this.app.register(rateLimit, {
      ...this.globalRateLimit,
      global: true,
      keyGenerator: (req) => req.ip,
      // NOTE: DNS-only Cloudflare doesn't require trustProxy.
      // If switching to Cloudflare proxy mode or behind a reverse proxy,
      // enable trustProxy in Fastify constructor and this will correctly read X-Forwarded-For
    });
  }

  public setupHooks() {
    this.app.setErrorHandler(errorHandler);
    this.app.setNotFoundHandler(
      {
        preHandler: this.app.rateLimit(this.globalRateLimit),
      },
      (request, reply) => {
        errorNotFoundHandler(request, reply);
      }
    );
    this.app.addHook("onRequest", async (request, _reply) => {
      request.headers["x-request-start"] = Date.now().toString();
    });
  }

  public setupRoutes() {
    const authController = new AuthController();
    const userController = new UserController();
    const messageController = new MessageController();
    const homeController = new HomeController();

    new AuthRoutes(authController).registerRoutes(this.app);
    new UserRoutes(userController).registerRoutes(this.app);
    new MessageRoutes(messageController).registerRoutes(this.app);
    new HomeRoutes(homeController).registerRoutes(this.app);
  }
}

export const buildApp = async (): Promise<FastifyApp> => {
  const server = new FastifyApp();
  await server.setupPlugins();
  server.setupHooks();
  server.setupRoutes();
  return server;
};

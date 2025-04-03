import Fastify, { FastifyBaseLogger } from "fastify";
import cors from "@fastify/cors";
import rateLimit, { RateLimitOptions } from "@fastify/rate-limit";
import { environment } from "./config/environment";
import { Database } from "./config/database";
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

class FastifyApp {
  private app = Fastify({ loggerInstance: logger as FastifyBaseLogger });
  private globalRateLimit: RateLimitOptions = {
    max: 100,
    timeWindow: "1 minute",
  };

  constructor() {}

  private async setupPlugins() {
    await this.app.register(cors, {
      origin: environment.cors.origin,
      methods: environment.cors.methods,
      allowedHeaders: environment.cors.allowedHeaders,
    });

    await this.app.register(rateLimit, {
      ...this.globalRateLimit,
      global: true,
      keyGenerator: (req) => req.ip,
    });
  }

  private setupHooks() {
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

  private setupRoutes() {
    const authController = new AuthController();
    const userController = new UserController();
    const messageController = new MessageController();
    const homeController = new HomeController();

    new AuthRoutes(authController).registerRoutes(this.app);
    new UserRoutes(userController).registerRoutes(this.app);
    new MessageRoutes(messageController).registerRoutes(this.app);
    new HomeRoutes(homeController).registerRoutes(this.app);
  }

  public async start() {
    try {
      logger.info("⏳ Initializing database...");
      await Database.initialize();
      logger.info("✅ Database initialized successfully.");

      await this.setupPlugins();
      this.setupHooks();
      this.setupRoutes();

      logger.info("🚀 Starting server...");
      await this.app.listen({ port: environment.port, host: "0.0.0.0" });

      logger.info(`✅ Server running at http://localhost:${environment.port}`);
    } catch (error) {
      logger.error("❌ Error during server startup:", error);
      process.exit(1);
    }
  }
}

(async () => {
  const server = new FastifyApp();
  await server.start();
})();

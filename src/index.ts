import { Database } from "./config/database";
import { buildApp } from "./app";
import { environment } from "./config/environment";
import { logger } from "./utils/logger.util";

class FastifyApp {
  public async start() {
    try {
      logger.info("⏳ Initializing database...");
      await Database.initialize();
      logger.info("✅ Database initialized successfully.");

      const server = await buildApp();

      logger.info("Starting server...");
      await server.app.listen({ port: environment.port, host: "0.0.0.0" });

      logger.info(`Server running at http://localhost:${environment.port}`);
    } catch (error) {
      logger.error({ err: error }, "Error during server startup:", error);
      process.exit(1);
    }
  }
}

(async () => {
  const server = new FastifyApp();
  await server.start();
})();

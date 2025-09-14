import { MikroORM, Options } from "@mikro-orm/core";
import { logger } from "../utils/logger.util";
import path from "path";
import mikroOrmConfig from "./mikro-orm.config";

class Database {
  private static instance: MikroORM;

  private static readonly config: Options = mikroOrmConfig;

  public static async initialize(): Promise<MikroORM> {
    if (!Database.instance) {
      try {
        Database.instance = await MikroORM.init(Database.config);

        const migrator = Database.instance.getMigrator();

        const executedMigrations = await migrator.getExecutedMigrations();
        const pendingMigrations = await migrator.getPendingMigrations();

        logger.info(`Executed migrations: ${executedMigrations.length}`);
        logger.info(`Pending migrations: ${pendingMigrations.length}`);

        if (process.env.NODE_ENV !== "production") {
          const diff = await Database.instance
            .getSchemaGenerator()
            .getUpdateSchemaSQL();

          if (diff.length > 0) {
            logger.info("Schema changes detected, creating migration...");
            await migrator.createMigration();
            logger.info("New migration created ✅");
          }
        }

        if (pendingMigrations.length > 0) {
          logger.info(
            `Running ${pendingMigrations.length} pending migrations...`
          );
          try {
            await migrator.up();
            logger.info("Migrations applied successfully ✅");
          } catch (migrationError: any) {
            if (
              migrationError.message?.includes("relation") &&
              migrationError.message?.includes("already exists")
            ) {
              logger.warn(
                "Some tables already exist. This might indicate database was already initialized."
              );
              logger.warn("Attempting to sync migration state...");

              const schemaGenerator = Database.instance.getSchemaGenerator();

              try {
                const currentSchema =
                  await schemaGenerator.getUpdateSchemaSQL();

                if (currentSchema.length === 0) {
                  logger.info(
                    "Database schema is up to date, but migrations are out of sync."
                  );
                  logger.info(
                    "Please manually resolve migration state or consider recreating migration files."
                  );
                } else {
                  logger.warn(
                    "Database schema differs from entities. Manual intervention needed."
                  );
                }
              } catch (schemaError) {
                logger.error("Error checking schema state:", schemaError);
              }

              logger.warn("Continuing startup despite migration issues...");
            } else {
              throw migrationError;
            }
          }
        } else {
          logger.info("No pending migrations to run ✅");
        }

        logger.info("Database connection established successfully ✅");
      } catch (error) {
        logger.error(
          { err: error },
          "Failed to connect to database: ❌",
          error
        );
        throw error;
      }
    }
    return Database.instance;
  }

  public static getORM(): MikroORM {
    if (!Database.instance) {
      throw new Error(
        "Database has not been initialized. Call initialize() first. 🛑"
      );
    }
    return Database.instance;
  }
}

export { Database };

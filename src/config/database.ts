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

        const diff = await Database.instance
          .getSchemaGenerator()
          .getUpdateSchemaSQL();

        if (diff.length > 0) {
          logger.info("Schema changes detected, creating migration...");

          await migrator.createMigration();
          logger.info("New migration created ✅");
        }

        await migrator.up();

        logger.info(
          "Database connection established successfully and migrations applied. ✅"
        );
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

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

        await Database.instance.getMigrator().createMigration();
        await Database.instance.getMigrator().up();
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

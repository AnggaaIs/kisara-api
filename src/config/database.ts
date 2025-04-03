import { MikroORM, Options } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { environment } from "./environment";
import { User } from "../entities/User";
import { Comment } from "../entities/Comment";
import { ReplyComment } from "../entities/ReplyComment";
import { logger } from "../utils/logger.util";

class Database {
  private static instance: MikroORM;

  private static readonly config: Options = {
    driver: PostgreSqlDriver,
    clientUrl: `postgresql://${environment.db.user}:${environment.db.password}@${environment.db.host}:${environment.db.port}/${environment.db.name}`,
    entities: [User, Comment, ReplyComment],
    debug: environment.nodeEnv === "development",
    allowGlobalContext: true,
    migrations: {
      path: "../../migrations",
      glob: "!(*.d).{js,ts}",
    },
  };

  public static async initialize(): Promise<MikroORM> {
    if (!Database.instance) {
      try {
        Database.instance = await MikroORM.init(Database.config);

        await Database.instance.getMigrator().up();
        logger.info(
          "Database connection established successfully and migrations applied. ✅"
        );
      } catch (error) {
        logger.error("Failed to connect to database: ❌", error);
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

import { Options } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { User } from "../entities/User";
import { Comment } from "../entities/Comment";
import { ReplyComment } from "../entities/ReplyComment";
import { environment } from "./environment";
import { Migrator } from "@mikro-orm/migrations";
import path from "path";
import { RefreshToken } from "../entities/RefreshToken";

const config: Options = {
  driver: PostgreSqlDriver,
  driverOptions: {
    connection: {
      ssl:
        environment.nodeEnv === "production"
          ? { rejectUnauthorized: false }
          : false,
    },
  },
  dbName: environment.db.name,
  host: environment.db.host,
  port: environment.db.port,
  user: environment.db.user,
  password: environment.db.password,
  entities: [User, Comment, ReplyComment, RefreshToken],
  debug: environment.nodeEnv === "development",
  allowGlobalContext: true,
  migrations: {
    path: path.resolve(__dirname, "../../migrations"),
    glob: "!(*.d).{js,ts}",
  },
  extensions: [Migrator],
};

export default config;

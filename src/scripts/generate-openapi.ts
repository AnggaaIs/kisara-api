import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { FastifyApp } from "../app";
import { Database } from "../config/database";

const fakeRepository = {} as never;
const fakeOrm = {
  em: {
    getRepository: () => fakeRepository,
  },
} as never;

async function main() {
  Database.getORM = () => fakeOrm as any;

  const server = new FastifyApp();
  await server.setupPlugins();
  server.setupHooks();
  server.setupRoutes();

  await server.app.ready();

  const openapi = server.app.swagger();
  const outputDir = path.resolve(process.cwd(), "openapi");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    path.join(outputDir, "openapi.json"),
    JSON.stringify(openapi, null, 2) + "\n"
  );

  await server.app.close();

  console.log("OpenAPI generated at openapi/openapi.json");
}

main().catch((error) => {
  console.error("Failed to generate OpenAPI:", error);
  process.exit(1);
});

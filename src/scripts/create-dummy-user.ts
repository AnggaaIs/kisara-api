import { Database } from "../config/database";
import { DummyDataCreator } from "../services/dummy.service";

async function main() {
  await Database.initialize();

  const result = await DummyDataCreator.createDummyUser();

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Failed to create dummy user:", error);
  process.exit(1);
});

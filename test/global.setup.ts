import { MongoMemoryServer } from "mongodb-memory-server";
import { setTestEnv } from "./utils";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create({
    instance: {
      dbName: process.env.DB_NAME,
    },
  });
  const uri = mongod.getUri();

  // Set the URI into process.env for the test environment
  setTestEnv({ MONGO_URI: uri });

  // Store the in-memory server reference
  (global as any).__MONGOD__ = mongod;
  console.log("[globalSetup] MongoDB test server started at", uri);
}

import * as mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { closeDatabase, resetDatabase } from "./utils";

export default async function globalTeardown() {
  // Close mongoose
  if (mongoose.connection.readyState !== 0) {
    await resetDatabase();
    await closeDatabase();
    console.log("[globalTeardown] Mongoose connection closed.");
  }

  // Stop in-memory server
  const mongod: MongoMemoryServer = (global as any).__MONGOD__;
  if (mongod) {
    await mongod.stop();
    console.log("[globalTeardown] MongoDB test server stopped.");
  }
}

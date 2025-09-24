import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  getProjectFixtures,
  getTaskFixtures,
  getUserFixtures,
} from "../fixtures";
import { UserSchema } from "../../src/users/users.schema";
import { ProjectSchema } from "../../src/projects/projects.schema";
import { TaskSchema } from "../../src/tasks/tasks.schema";

let mongod: MongoMemoryServer;

export function createMockMongooseDoc<T extends object>(
  data: T,
): T & { toJSON: () => T } {
  return {
    ...data,
    toJSON: () => data,
  };
}

export async function mongooseConnect(uri: string) {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
    console.log(`[mongooseConnect] MongoDB connected to ${uri}`);
  }
}

export async function startInMemoryMongo() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  return uri;
}

export async function stopInMemoryMongo() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

export const resetDatabase = async () => {
  const { connection } = mongoose;

  // If not connected, skip cleanup
  if (connection.readyState !== 1) {
    console.warn("[resetDatabase] Mongoose is not connected.");
    return;
  }
  // Drop all collections
  // via collections
  const collections = Object.keys(connection.collections);
  for (const name of collections) {
    const collection = connection.collections[name];
    try {
      await collection.deleteMany({});
    } catch (error) {
      console.error(
        `[resetDatabase] Failed to delete collection ${name}:`,
        error,
      );
    }
  }

  // via models
  // const modelNames = mongoose.modelNames(); // All registered models
  // console.log("[resetDatabase] modelNames:", modelNames);

  // for (const name of modelNames) {
  //   try {
  //     await mongoose.model(name).deleteMany({});
  //     console.log(`[resetDatabase] Cleared model: ${name}`);
  //   } catch (err) {
  //     console.error(`[resetDatabase] Failed to reset model ${name}:`, err);
  //   }
  // }
  // await mongoose.connection.db?.dropDatabase();
};

// Properly closes the mongoose connection.
export const closeDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    await mongoose.disconnect();
    console.log("[closeDatabase] MongoDB connection closed.");
  }
};

export const ensureMongoConnected = async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI!);
  }
};

export const insertUserFixtures = async () => {
  const users = await getUserFixtures();
  await ensureMongoConnected();
  await mongoose.connection.collection("users").insertMany(users);
  return users;
};

export const insertProjectFixtures = async (userId: string) => {
  const projects = getProjectFixtures(userId);
  await ensureMongoConnected();
  await mongoose.connection.collection("projects").insertMany(projects);
  return projects;
};

export const insertTaskFixtures = async (projectId: string) => {
  const tasks = getTaskFixtures(projectId);
  await ensureMongoConnected();
  await mongoose.connection.collection("tasks").insertMany(tasks);
  return tasks;
};

export const insertAllFixtures = async () => {
  await ensureMongoConnected();
  const users = await insertUserFixtures();
  const projects = await insertProjectFixtures(users[0].id);
  const tasks = await insertTaskFixtures(projects[0].id);

  return { users, projects, tasks };
};

export const registerTestCollections = async () => {
  const connection = mongoose.connection;

  if (connection.readyState !== 1) {
    console.warn("[registerTestCollections] Mongoose is not connected.");
    return;
  }

  const collectionsToRegister = [
    { name: "users", schema: UserSchema },
    { name: "projects", schema: ProjectSchema },
    { name: "tasks", schema: TaskSchema },
  ];

  for (const { name, schema } of collectionsToRegister) {
    const collection = connection.collection(name);
    await collection.deleteMany({});
    await collection.insertOne({});
    // const model = connection.model(name, schema);
    // await model.create({});        // insert dummy
    // await model.deleteMany({});    // immediately clean
    console.log(`[registerTestCollections] Registered collection: ${name}`);
  }
};

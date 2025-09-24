import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { App } from "supertest/types";
import { closeDatabase, resetDatabase, setupTestApp } from "../utils";

describe("AppController (e2e)", () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  afterAll(async () => {
    await resetDatabase();
    await closeDatabase();
    await app.close();
    console.log("[app.e2e] closed");
    // console.log(process.getActiveResourcesInfo());
  });

  it("/ (GET)", async () => {
    const res = await request(app.getHttpServer()).get("/");

    expect(res.body.data).toEqual("Hello World!");
    expect(res.body.meta.statusCode).toEqual(200);
    expect(res.body.meta.timestamp).toBeDefined();
  });
});

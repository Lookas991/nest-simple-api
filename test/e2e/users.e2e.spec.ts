import * as request from "supertest";
import { INestApplication } from "@nestjs/common";
import { closeDatabase, resetDatabase, setupTestApp } from "../utils";

describe("Users (e2e)", () => {
  let app: INestApplication;
  let cookie: any;
  let httpServer: any;

  beforeAll(async () => {
    app = await setupTestApp();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await resetDatabase();
    await closeDatabase();

    await app.close();
    console.log("[users.e2e] closed");
  });

  describe("/users/me (GET)", () => {
    beforeAll(async () => {
      await resetDatabase();

      // Register and login to get token
      const res = await request(httpServer).post("/auth/register").send({
        email: "me@test.com",
        password: "password123",
      });

      cookie = res.headers["set-cookie"];
    });
    it("should return the current logged-in user", async () => {
      const res = await request(httpServer)
        .get("/users/me")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body?.data).toBeDefined();
      expect(res.body.data.email).toBe("me@test.com");
      expect(res.body.data.id).toBeDefined();
    });
    it("should return 401 if no token is provided", async () => {
      const res = await request(httpServer).get("/users/me");

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/unauthorized/i);
    });

    it("should return 401 if token is invalid", async () => {
      const res = await request(httpServer)
        .get("/users/me")
        .set("Cookie", "access_token=invalidtoken");

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/unauthorized/i);
    });
  });
});

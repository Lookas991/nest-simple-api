import * as request from "supertest";
import { INestApplication } from "@nestjs/common";
import { setupTestApp, resetDatabase, closeDatabase } from "../utils";

describe("Auth (e2e)", () => {
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    app = await setupTestApp();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await resetDatabase();
    await closeDatabase();

    await app.close();
    console.log("[auth.e2e] closed");
    // console.log(process.getActiveResourcesInfo());
  });

  describe("/auth/register (POST)", () => {
    it("should create an user and return the access token", async () => {
      const res = await request(httpServer).post("/auth/register").send({
        email: "e2e@test.com",
        password: "password123",
      });

      expect(res.status).toBe(201);
      expect(res.body?.data?.message).toBe("Registered successfully");
      expect(res.headers["set-cookie"][0]).toContain("access_token=");
    });
    it("should throw a conflict error if email already exists", async () => {
      const res = await request(httpServer).post("/auth/register").send({
        email: "e2e@test.com",
        password: "password123",
      });

      expect(res.status).toEqual(409);
      expect(res.body?.error).toBeDefined();
      expect(res.body?.error?.statusCode).toEqual(409);
      expect(res.body?.error?.message).toEqual("Email already registered");
    });
  });

  describe("/auth/login (POST)", () => {
    it("should validate the user and return access token", async () => {
      const res = await request(httpServer).post("/auth/login").send({
        email: "e2e@test.com",
        password: "password123",
      });

      expect(res.status).toEqual(201);
      expect(res.headers["set-cookie"][0]).toContain("access_token=");
      expect(res.body?.data).toBeDefined();
      expect(res.body?.data?.message).toBe("Login successfully");
    });

    it("should return an error if user with email not found", async () => {
      const res = await request(httpServer).post("/auth/login").send({
        email: "non-existent@test.com",
        password: "non-existent",
      });

      expect(res.status).toEqual(409);
      expect(res.body?.error).toBeDefined();
      expect(res.body?.error?.statusCode).toEqual(409);
      expect(res.body?.error?.message).toEqual("Invalid credentials");
    });
  });
  describe("/auth/me (GET)", () => {
    let cookie: any;

    beforeAll(async () => {
      await resetDatabase();

      // // Register and login to get token
      const res = await request(httpServer).post("/auth/register").send({
        email: "me@test.com",
        password: "password123",
      });

      cookie = res.headers["set-cookie"];
    });

    it("should return the current logged-in user", async () => {
      const res = await request(httpServer)
        .get("/auth/me")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body?.data).toBeDefined();
      expect(res.body.data.email).toBe("me@test.com");
      expect(res.body.data.id).toBeDefined();
    });

    it("should return 401 if no token is provided", async () => {
      const res = await request(httpServer).get("/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/unauthorized/i);
    });

    it("should return 401 if token is invalid", async () => {
      const res = await request(httpServer)
        .get("/auth/me")
        .set("Cookie", "invalidtoken");

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/unauthorized/i);
    });
  });
});

import * as request from "supertest";
import { INestApplication } from "@nestjs/common";
import { closeDatabase, resetDatabase, setupTestApp } from "../utils";

describe("UploadController (e2e)", () => {
  let app: INestApplication;
  let httpServer: any;
  let cookie: string;
  let userId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    httpServer = app.getHttpServer();

    const registerRes = await request(httpServer).post("/auth/register").send({
      email: "uploade2e@test.com",
      password: "password123",
    });

    cookie = registerRes.headers["set-cookie"][0];
    const payload = JSON.parse(
      Buffer.from(cookie.split(".")[1], "base64").toString(),
    );
    userId = payload.sub;
  });

  afterAll(async () => {
    await resetDatabase();
    await closeDatabase();
    await app.close();
    console.log("[upload.e2e] closed");
  });

  it("/upload/avatar (POST) uploads file and returns key", async () => {
    const response = await request(httpServer)
      .post("/upload/avatar")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("testimage"), {
        filename: "avatar.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.key).toMatch(
      new RegExp(`^avatars/${userId}_avatar\\.png$`),
    );
  });

  it("/upload/download/:key (GET) streams the file", async () => {
    // upload first
    const uploadRes = await request(httpServer)
      .post("/upload/avatar")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("testimage"), {
        filename: "avatar.png",
        contentType: "image/png",
      });

    const key = uploadRes.body.data.key;

    const downloadRes = await request(httpServer)
      .get(`/upload/download/${encodeURIComponent(key)}`)
      .set("Cookie", cookie);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers["content-type"]).toMatch(/image\/png/);
  });
});

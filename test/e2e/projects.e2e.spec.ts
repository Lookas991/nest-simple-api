import * as request from "supertest";
import { v4 as uuid } from "uuid";
import { INestApplication } from "@nestjs/common";
import {
  setupTestApp,
  closeDatabase,
  resetDatabase,
  insertProjectFixtures,
} from "../utils";
import { CreateProjectDto } from "../../src/projects/dto";

describe("Projects (e2e)", () => {
  let app: INestApplication;
  let httpServer: any;
  let token: string;
  let cookie: any;
  let userId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    httpServer = app.getHttpServer();

    const registerRes = await request(httpServer).post("/auth/register").send({
      email: "projecte2e@test.com",
      password: "password123",
    });
    cookie = registerRes.headers["set-cookie"];
    token = cookie[0];
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString(),
    );
    userId = payload.sub;
  });

  afterAll(async () => {
    await resetDatabase();
    await closeDatabase();
    await app.close();
    console.log("[projects.e2e] closed");
  });

  describe("/projects (POST)", () => {
    it("should create a new project", async () => {
      const dto: CreateProjectDto = {
        title: "New Project",
        description: "A test project",
      };

      const res = await request(httpServer)
        .post("/projects")
        .set("Cookie", cookie)
        .send(dto);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe(dto.title);
      expect(res.body.data.ownerId).toBe(userId);
    });

    it("should throw a error if validation failed", async () => {
      const res = await request(httpServer)
        .post("/projects")
        .set("Cookie", cookie)
        .send({ title: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toBe("Validation failed");
    });
  });

  describe("/projects (GET with query filters)", () => {
    beforeEach(async () => {
      await resetDatabase();
      await insertProjectFixtures(userId);
    });
    it("should return all projects for user", async () => {
      const res = await request(httpServer)
        .get("/projects")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(res.body.pagination.itemCount);
    });

    it("should return results sorted ascending by title", async () => {
      const res = await request(httpServer)
        .get("/projects?sortBy=title&sortOrder=asc")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      const titles = res.body.data.map((p: any) => p.title);
      expect(titles).toEqual(["Demo Project 1", "Demo Project 2"]);
    });

    it("should return only 2 items per page", async () => {
      const res = await request(httpServer)
        .get("/projects?page=1&limit=2")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.totalItems).toBeGreaterThan(1);
      expect(res.body.pagination.totalPages).toBeGreaterThan(0);
    });

    it("should return filtered results using search", async () => {
      const res = await request(httpServer)
        .get("/projects?search=1")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      const titles = res.body.data.map((p: any) => p.title.toLowerCase());
      expect(titles).toContain("demo project 1");
      expect(res.body.data.length).toBe(1);
    });

    it("should return filtered results using search", async () => {
      const res = await request(httpServer)
        .get("/projects?search=one")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      const titles = res.body.data.map((p: any) => p.title.toLowerCase());
      expect(titles).toContain("demo project 2");
      const descriptions = res.body.data.map((p: any) =>
        p.description.toLowerCase(),
      );
      expect(descriptions).toContain("another one");
      expect(res.body.data.length).toBe(1);
    });
  });

  describe("/projects/:id (GET)", () => {
    it("should return project by id", async () => {
      const createRes = await request(httpServer)
        .post("/projects")
        .set("Cookie", cookie)
        .send({ title: "Single Project" });

      const projectId = createRes.body.data.id;

      const res = await request(httpServer)
        .get(`/projects/${projectId}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(projectId);
    });

    it("should return 404 for non-existent id", async () => {
      const non_id = uuid();
      const res = await request(httpServer)
        .get(`/projects/${non_id}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(404);
    });
  });

  describe("/projects/:id (PATCH)", () => {
    it("should update project", async () => {
      const createRes = await request(httpServer)
        .post("/projects")
        .set("Cookie", cookie)
        .send({ title: "To Update" });

      const projectId = createRes.body.data.id;

      const res = await request(httpServer)
        .patch(`/projects/${projectId}`)
        .set("Cookie", cookie)
        .send({ title: "Updated Project Title" });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated Project Title");
    });

    it("should return 404 for non-existent id", async () => {
      const non_id = uuid();
      const res = await request(httpServer)
        .patch(`/projects/${non_id}`)
        .set("Cookie", cookie)
        .send({ title: "Wishful" });

      expect(res.status).toBe(404);
    });
  });

  describe("/projects/:id (DELETE)", () => {
    it("should delete a project", async () => {
      const createRes = await request(httpServer)
        .post("/projects")
        .set("Cookie", cookie)
        .send({ title: "To Delete" });

      const projectId = createRes.body.data.id;

      const res = await request(httpServer)
        .delete(`/projects/${projectId}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(projectId);
    });

    it("should return 404 for non-existent id", async () => {
      const projectId = uuid();

      const res = await request(httpServer)
        .delete(`/projects/${projectId}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(404);
    });
  });
});

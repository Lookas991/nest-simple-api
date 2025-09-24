import * as request from "supertest";
import { v4 as uuid } from "uuid";
import { INestApplication } from "@nestjs/common";
import {
  closeDatabase,
  insertProjectFixtures,
  insertTaskFixtures,
  resetDatabase,
  setupTestApp,
} from "../utils";
import { CreateTaskDto } from "../../src/tasks/dto";

describe("Tasks (e2e)", () => {
  let app: INestApplication;
  let httpServer: any;
  let cookie: any;
  let token: string;
  let userId: string;
  let projectId: string;

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
    console.log("[tasks.e2e] closed");
  });

  describe("/tasks (POST)", () => {
    it("should create new task", async () => {
      const projects = await insertProjectFixtures(userId);
      projectId = projects[0].id;
      const now = new Date();
      const dto: CreateTaskDto = {
        title: "New task",
        description: "A test task",
        dueDate: new Date(now.getTime() + 3 * 86400000),
        projectId,
      };

      const res = await request(httpServer)
        .post("/tasks")
        .set("Cookie", cookie)
        .send(dto);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe(dto.title);
      expect(res.body.data.description).toBe(dto.description);
      expect(res.body.data.projectId).toBe(projectId);
    });
  });

  describe("/project/:projectId (GET with query filters)", () => {
    beforeAll(async () => {
      await resetDatabase();
      const projects = await insertProjectFixtures(userId);
      projectId = projects[0].id;
      const tasks = await insertTaskFixtures(projectId);
    });

    it("should return all tasks for a project", async () => {
      const res = await request(httpServer)
        .get(`/tasks/project/${projectId}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(res.body.pagination.itemCount);
    });

    it("should retrun results sorted ascending ty title", async () => {
      const res = await request(httpServer)
        .get(`/tasks/project/${projectId}?sortBy=dueDate&sortOrder=asc`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data.length).toBe(res.body.pagination.totalItems);
    });

    it("should return only 2 items per page", async () => {
      const res = await request(httpServer)
        .get(`/tasks/project/${projectId}?page=1&limit=2`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.totalItems).toBe(5);
      expect(res.body.pagination.totalPages).toBe(3);
    });

    it("should return filtered results using search", async () => {
      const res = await request(httpServer)
        .get(`/tasks/project/${projectId}?search=important`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      const titles = res.body.data.map((t: any) => t.title.toLowerCase());
      expect(titles).toContain("important backend refactor");
      expect(res.body.data.length).toBe(1);
    });
  });

  describe("/tasks/:id (GET)", () => {
    let taskId: string;
    beforeAll(async () => {
      const tasks = await insertTaskFixtures(projectId);
      taskId = tasks[0].id;
    });
    it("should return project by id", async () => {
      const res = await request(httpServer)
        .get(`/tasks/${taskId}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(taskId);
    });

    it("should return 404 for non-existent id", async () => {
      const non_id = uuid();
      const res = await request(httpServer)
        .get(`/tasks/${non_id}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(404);
    });
  });

  describe("/tasks/:id (PATCH)", () => {
    let taskId: string;
    beforeAll(async () => {
      const tasks = await insertTaskFixtures(projectId);
      taskId = tasks[0].id;
    });

    it("should update task", async () => {
      const res = await request(httpServer)
        .patch(`/tasks/${taskId}`)
        .set("Cookie", cookie)
        .send({ title: "Updated Task Title" });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.title).toBe("Updated Task Title");
    });

    it("should return 404 for non-existent id", async () => {
      const non_id = uuid();
      const res = await request(httpServer)
        .patch(`/tasks/${non_id}`)
        .set("Cookie", cookie)
        .send({ title: "Almost" });

      expect(res.status).toBe(404);
    });
  });

  describe("/tasks/:id (DELETE)", () => {
    let taskId: string;
    beforeAll(async () => {
      const tasks = await insertTaskFixtures(projectId);
      taskId = tasks[0].id;
    });

    it("should delete a task", async () => {
      const res = await request(httpServer)
        .delete(`/tasks/${taskId}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(taskId);
    });

    it("should return 404 for non-existent id", async () => {
      const non_id = uuid();
      const res = await request(httpServer)
        .delete(`/tasks/${non_id}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(404);
    });
  });
});

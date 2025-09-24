import { Test, TestingModule } from "@nestjs/testing";
import { TasksService } from "./tasks.service";
import { TasksRepository } from "./tasks.repository";
import { CreateTaskDto, TaskResponseDto } from "./dto";
import {
  closeDatabase,
  insertProjectFixtures,
  insertTaskFixtures,
  mongooseConnect,
  resetDatabase,
  TestUtilsModule,
} from "../../test/utils";
import {
  getProjectFixtures,
  getTaskFixtures,
  getUserFixtures,
} from "../../test/fixtures";
import mongoose from "mongoose";
import { ProjectsService } from "../projects/projects.service";
import { NotFoundError } from "../common";
import { UsersDocument } from "src/users/users.model";
import { ProjectsDocument } from "src/projects/projects.model";
import { TasksDocument } from "./tasks.model";

describe("TasksService (Integration)", () => {
  let module: TestingModule;

  let tasksService: TasksService;

  let dto: CreateTaskDto;
  let created: TaskResponseDto;
  let userFixtures: UsersDocument[];
  let projectFixtures: ProjectsDocument[];
  let taskFixtures: TasksDocument[];

  beforeAll(async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI not set");

    await mongooseConnect(uri);

    module = await Test.createTestingModule({
      imports: [TestUtilsModule.register({ useMocks: false })],
    }).compile();

    tasksService = module.get<TasksService>(TasksService);

    userFixtures = await getUserFixtures();
    projectFixtures = getProjectFixtures(userFixtures[0].id);
    taskFixtures = getTaskFixtures(projectFixtures[0].id);

    dto = {
      title: "Task integration tests title",
      projectId: projectFixtures[0].id,
    };
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe("Connection Check", () => {
    it("should be connected to MongoDB", () => {
      expect(mongoose.connection.readyState).toBe(1);
    });
  });

  // tasksService.remove

  describe("Create a task", () => {
    it("should create a new task and return <TaskResponseDto> as a result", async () => {
      projectFixtures = await insertProjectFixtures(userFixtures[0].id);
      dto.projectId = projectFixtures[0].id;
      created = await tasksService.create(dto, userFixtures[0].id);

      expect(created).toBeDefined();
      expect(created.title).toBe(dto.title);
      expect(created.projectId).toBe(dto.projectId);
    });

    describe("Find all tasks for a project", () => {
      it("should return tasks for a project", async () => {
        projectFixtures = await insertProjectFixtures(userFixtures[0].id);
        taskFixtures = await insertTaskFixtures(projectFixtures[0].id);
        const results = await tasksService.findAllForProject(
          projectFixtures[0].id,
          userFixtures[0].id,
          {},
        );

        expect(results).toBeDefined();
        expect(results?.data).toBeDefined();
        expect(results.data.length).not.toBe(0);
        expect(results?.pagination).toBeDefined();
      });
      it("should return [] if no tasks found", async () => {
        projectFixtures = await insertProjectFixtures(userFixtures[0].id);

        const results = await tasksService.findAllForProject(
          projectFixtures[0].id,
          userFixtures[0].id,
          {},
        );

        expect(results).toBeDefined();
        expect(results.data).toBeDefined();
        expect(results.pagination).toBeDefined();
        expect(results.data.length).toBe(0);
        expect(results.pagination.totalItems).toBe(0);
      });
    });

    describe("Find a task by id", () => {
      it("should return an task base on id", async () => {
        projectFixtures = await insertProjectFixtures(userFixtures[0].id);
        taskFixtures = await insertTaskFixtures(projectFixtures[0].id);

        const task = await tasksService.findById(taskFixtures[0].id);

        expect(task.title).toEqual(taskFixtures[0].title);
        expect(task.projectId).toEqual(taskFixtures[0].projectId);
      });
      it("should throw a NotFoundError if no task found", async () => {
        await expect(tasksService.findById(taskFixtures[0].id)).rejects.toThrow(
          NotFoundError,
        );
      });
    });

    describe("Update a task", () => {
      it("should update task and return the updated task", async () => {
        projectFixtures = await insertProjectFixtures(userFixtures[0].id);
        taskFixtures = await insertTaskFixtures(projectFixtures[0].id);

        const updated = await tasksService.update(taskFixtures[0].id, {
          title: "Updated integration task title",
        });

        expect(updated).toBeDefined();
        expect(updated.id).toBe(taskFixtures[0].id);
        expect(updated.projectId).toBe(taskFixtures[0].projectId);
      });
      it("should throw a NotFoundError is task not found", async () => {
        await expect(
          tasksService.update("non-existent", { title: "You shall not pass" }),
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe("Remove a task", () => {
      it("should remove a task and return task's id", async () => {
        projectFixtures = await insertProjectFixtures(userFixtures[0].id);
        taskFixtures = await insertTaskFixtures(projectFixtures[0].id);

        const result = await tasksService.remove(taskFixtures[0].id);

        expect(result).toBeDefined();
        expect(result.id).toBe(taskFixtures[0].id);
      });

      it("should throw a NotFoundError if no task found", async () => {
        await expect(tasksService.remove("non-existent")).rejects.toThrow(
          NotFoundError,
        );
      });
    });
  });
});

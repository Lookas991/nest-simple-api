import mongoose from "mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { ProjectsService } from "./projects.service";
import { ProjectsRepository } from "./projects.repository";
import {
  closeDatabase,
  insertProjectFixtures,
  mongooseConnect,
  resetDatabase,
  TestUtilsModule,
} from "../../test/utils";
import { getProjectFixtures, getUserFixtures } from "../../test/fixtures";
import { CreateProjectDto, ProjectResponseDto } from "./dto";
import { NotFoundError } from "../common";

describe("ProjectsService (Integration)", () => {
  let module: TestingModule;
  let projectsService: ProjectsService;
  let projectsRepository: ProjectsRepository;

  let dto: CreateProjectDto;
  let created: ProjectResponseDto;
  let userFixtures: any[];
  let projectFixtures: any[];

  beforeAll(async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI not set");

    await mongooseConnect(uri);

    module = await Test.createTestingModule({
      imports: [TestUtilsModule.register({ useMocks: false })],
    }).compile();

    projectsRepository = module.get<ProjectsRepository>(ProjectsRepository);
    projectsService = module.get<ProjectsService>(ProjectsService);

    dto = {
      title: "new integration testing project",
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

  describe("Create a project", () => {
    it("should create a new project and return <ProjectResponseDto> as a result", async () => {
      const users = await getUserFixtures();

      created = await projectsService.create(dto, users[0].id);

      expect(created).toBeDefined();
      expect(created.title).toBe(dto.title);
      expect(created.ownerId).toBe(users[0].id);
    });
  });

  describe("Find all projects for a user", () => {
    let users: any[];
    let projects: any[];
    it("should return all projects for a user", async () => {
      users = await getUserFixtures();
      const userId = users[0].id;

      projects = await insertProjectFixtures(users[0].id);

      const results = await projectsService.findAllForUser(userId, {});
      expect(results).toBeDefined();
      expect(results?.data).toBeDefined();
      expect(results.data.length).not.toBe(0);
      expect(results?.pagination).toBeDefined();
    });
    it("should return [] if no projects found", async () => {
      users = await getUserFixtures();
      const userId = users[0].id;

      const results = await projectsService.findAllForUser(userId, {});

      expect(results).toBeDefined();
      expect(results.data).toBeDefined();
      expect(results.pagination).toBeDefined();
      expect(results.data.length).toBe(0);
      expect(results.pagination.totalItems).toBe(0);
    });
  });

  describe("Find a project by id", () => {
    let users: any[];
    it("should return an project based on id", async () => {
      users = await getUserFixtures();
      created = await projectsService.create(dto, users[0].id);

      const project = await projectsService.findById(created.id, users[0].id);

      expect(project).toEqual(created);
    });
    it("should throw a NotFoundError if no project found", async () => {
      users = await getUserFixtures();

      await expect(
        projectsService.findById("non-existent-id", users[0].id),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("Update project", () => {
    let users: any[];
    it("should update the project and return the result as <ProjectResponseDto>", async () => {
      users = await getUserFixtures();
      created = await projectsService.create(dto, users[0].id);

      const updated = await projectsService.update(created.id, users[0].id, {
        title: "Updated integration title",
      });

      expect(updated).toBeDefined();
      expect(updated.id).toBe(created.id);
      expect(updated.title).toEqual("Updated integration title");
    });

    it("should throw a NotFoundError if no project found", async () => {
      users = await getUserFixtures();
      await expect(
        projectsService.update("non-existent", users[0].id, { title: "Error" }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("Remove a project", () => {
    let users: any[];
    it("should return project's id if successful", async () => {
      users = await getUserFixtures();
      created = await projectsService.create(dto, users[0].id);

      const result = await projectsService.remove(created.id, users[0].id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
    });

    it("should throw a NotFoundError if no project found", async () => {
      users = await getUserFixtures();

      await expect(
        projectsService.remove("non-existent", users[0].id),
      ).rejects.toThrow(NotFoundError);
    });
  });
});

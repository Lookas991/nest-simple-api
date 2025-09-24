import { Test, TestingModule } from "@nestjs/testing";

import { TasksService } from "./tasks.service";
import { TasksRepository } from "./tasks.repository";
import { createMockMongooseDoc, TestUtilsModule } from "../../test/utils";
import {
  getProjectFixtures,
  getTaskFixtures,
  getUserFixtures,
} from "../../test/fixtures";
import { ProjectsService } from "../projects/projects.service";
import { TaskResponseDto, UpdateTaskDto } from "./dto";
import { NotFoundError } from "../common";
import { TasksDocument } from "./tasks.model";
import { ProjectsDocument } from "../projects/projects.model";
import { UsersDocument } from "../users/users.model";

describe("TasksService (Unit)", () => {
  let service: TasksService;
  let repository: jest.Mocked<TasksRepository>;

  let projectService: ProjectsService;

  let projectFixtures: ProjectsDocument[];
  let taskFixtures: any[];
  let userFixtures: UsersDocument[];

  beforeAll(async () => {
    userFixtures = await getUserFixtures();
    projectFixtures = getProjectFixtures(userFixtures[0].id);
    taskFixtures = getTaskFixtures(projectFixtures[0].id);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TestUtilsModule.register({
          useMocks: true,
        }),
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repository = module.get(TasksRepository);
    projectService = module.get(ProjectsService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Create task", () => {
    it("Success", async () => {
      const taskDto = {
        title: "unit testing task",
        projectId: "project-uuid",
      };

      repository.create.mockImplementation(async (data) => {
        return createMockMongooseDoc({
          id: "some-task-uuid",
          title: data.title,
          projectId: data.projectId,
          createdAt: new Date(),
          updateAt: new Date(),
        } as any);
      });
      projectService.findById = jest.fn().mockResolvedValue(projectFixtures[0]);

      const result = await service.create(taskDto, userFixtures[0].id);
      expect(result).toBeInstanceOf(TaskResponseDto);
      expect(result.title).toBe(taskDto.title);
      expect(result?.projectId).toBe(taskDto.projectId);
    });
  });

  describe("Find all tasks of a project", () => {
    it("Success", async () => {
      const pagination = {
        totalItems: taskFixtures.length,
        itemCount: taskFixtures.length,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      };

      repository.paginateTasks.mockResolvedValue({
        data: taskFixtures.map((task) => createMockMongooseDoc(task)),
        pagination,
      });
      projectService.findById = jest.fn().mockResolvedValue(projectFixtures[0]);

      const results = await service.findAllForProject(
        projectFixtures[0].id,
        userFixtures[0].id,
        {},
      );

      expect(results.data.length).toEqual(taskFixtures.length);
      expect(results.data[0]).toEqual(taskFixtures[0]);
      expect(results.data[1]).toEqual(taskFixtures[1]);
      expect(results.pagination).toEqual(pagination);
    });

    it("No tasks found, return empty array", async () => {
      const pagination = {
        totalItems: 0,
        itemCount: 0,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      };
      repository.paginateTasks.mockResolvedValue({
        data: [],
        pagination,
      });
      projectService.findById = jest.fn().mockResolvedValue(projectFixtures[1]);

      const results = await service.findAllForProject(
        projectFixtures[1].id,
        userFixtures[0].id,
        {},
      );

      expect(results).not.toBeUndefined();
      expect(results.data.length).toEqual(0);
      expect(results.pagination).toEqual(pagination);
    });
  });

  describe("Update task", () => {
    it("Success", async () => {
      const id: string = taskFixtures[0].id;
      const projectId = projectFixtures[0].id;

      const dto: UpdateTaskDto = {
        title: "Updated title",
        description: "Updated description",
      };

      const mockTask = createMockMongooseDoc({
        id,
        projectId,
        ...dto,
        createAt: new Date(),
        updatedAt: new Date(),
      } as any);

      repository.update.mockResolvedValue(mockTask);
      repository.findById.mockResolvedValue(mockTask);

      const result = await service.update(id, dto);

      expect(result.id).toBe(id);
      expect(result.title).toBe(dto.title);
      expect(result.description).toBe(dto.description);
    });

    it("Should throw NotFoundError when task not found", async () => {
      const id = "non-existent-id";

      repository.update.mockResolvedValue(null);
      repository.findById.mockResolvedValue(null);

      await expect(service.update(id, {})).rejects.toThrow(NotFoundError);
    });
  });

  describe("Delete task", () => {
    it("Success, returns id", async () => {
      repository.delete.mockResolvedValue(
        createMockMongooseDoc(taskFixtures[0]),
      );
      repository.findById.mockResolvedValue(
        createMockMongooseDoc(taskFixtures[0]),
      );

      const result = await service.remove(taskFixtures[0].id);

      expect(result.id).toBe(taskFixtures[0].id);
    });

    it("Should throw NotFoundError when task not found", async () => {
      const id = "non-existent-id";
      repository.delete.mockRejectedValue(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundError);
    });
  });
});

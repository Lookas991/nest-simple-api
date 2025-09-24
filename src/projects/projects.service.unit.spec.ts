import { v4 as uuid } from "uuid";
import { Test, TestingModule } from "@nestjs/testing";
import { ProjectsService } from "./projects.service";
import { ProjectsRepository } from "./projects.repository";
import { getProjectFixtures, getUserFixtures } from "../../test/fixtures";

import { TestUtilsModule } from "../../test/utils/test-utils.module";
import { createMockMongooseDoc } from "../../test/utils";
import { ProjectResponseDto, UpdateProjectDto } from "./dto";
import { NotFoundError } from "../common";

describe("ProjectsService (Unit)", () => {
  let service: ProjectsService;
  let repository: jest.Mocked<ProjectsRepository>;

  let usersFixtures: any[];
  let projectFixtures: any[];

  beforeAll(async () => {
    usersFixtures = await getUserFixtures();
    projectFixtures = getProjectFixtures(usersFixtures[0].id);
  });

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        TestUtilsModule.register({
          useMocks: true,
        }),
      ],
    }).compile();

    service = moduleRef.get(ProjectsService);
    repository = moduleRef.get(ProjectsRepository);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Create project", () => {
    it("Success", async () => {
      const projectDto = {
        title: "unit testing project",
        ownerId: "owner-uuid",
      };

      repository.create.mockImplementation(async (data) => {
        return createMockMongooseDoc({
          id: "some-uuid",
          title: data.title,
          ownerId: data.ownerId,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      });

      const result = await service.create(projectDto, projectDto.ownerId);

      expect(result).toBeInstanceOf(ProjectResponseDto);
      expect(result.title).toBe(projectDto.title);
      expect(result.ownerId).toBe(projectDto.ownerId);
    });
  });

  describe("Find by id", () => {
    it("Success", async () => {
      repository.findById.mockResolvedValue(
        createMockMongooseDoc(projectFixtures[0]),
      );

      const result = await service.findById(
        projectFixtures[0],
        projectFixtures[0].ownerId,
      );

      expect(result).toBeInstanceOf(ProjectResponseDto);
      expect(result).toEqual(projectFixtures[0]);
    });

    it("Should throw NotFoundError when project not found", async () => {
      const id = "non-existent-id";
      const userId = usersFixtures[0].id;
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(id, userId)).rejects.toThrow(NotFoundError);
      await expect(service.findById(id, userId)).rejects.toThrow(
        `Object with ID ${id} not found`,
      );
    });
  });
  describe("Find all projects for user", () => {
    it("Success", async () => {
      const pagination = {
        totalItems: projectFixtures.length,
        itemCount: projectFixtures.length,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      };
      repository.paginateProjects.mockResolvedValue({
        data: projectFixtures.map((user) => createMockMongooseDoc(user)),
        pagination,
      });

      const results = await service.findAllForUser(usersFixtures[0].id, {});

      expect(results.data.length).toEqual(projectFixtures.length);
      expect(results.data[0]).toEqual(projectFixtures[0]);
      expect(results.data[1]).toEqual(projectFixtures[1]);
      expect(results.pagination).toEqual(pagination);
    });
    it("No projects, returns empty array", async () => {
      const pagination = {
        totalItems: 0,
        itemCount: 0,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      };
      repository.paginateProjects.mockResolvedValue({
        data: [],
        pagination,
      });

      const results = await service.findAllForUser(usersFixtures[1].id, {});

      expect(results).not.toBeUndefined();
      expect(results.data.length).toEqual(0);
      expect(results.pagination).toEqual(pagination);
    });
  });

  describe("Update project", () => {
    it("Success", async () => {
      const id = projectFixtures[0].id;
      const userId = usersFixtures[0].id;

      const dto: UpdateProjectDto = {
        title: "Updated Title",
        description: "Updated Description",
      };

      const mockProject = createMockMongooseDoc({
        id,
        ownerId: userId,
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      repository.update.mockResolvedValue(mockProject);
      repository.findById.mockResolvedValue(mockProject);

      const result = await service.update(id, userId, dto);

      expect(result.id).toBe(id);
      expect(result.title).toBe(dto.title);
      expect(result.description).toBe(dto.description);
    });

    it("Should throw NotFoundError when project not found", async () => {
      const id = "non-existent-id";
      const userId = usersFixtures[0].id;
      repository.update.mockResolvedValue(null);
      repository.findById.mockResolvedValue(null);

      await expect(service.update(id, userId, {})).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("Delete project", () => {
    it("Success, returns id", async () => {
      repository.delete.mockResolvedValue(
        createMockMongooseDoc(projectFixtures[0]),
      );
      repository.findById.mockResolvedValue(
        createMockMongooseDoc(projectFixtures[0]),
      );

      const result = await service.remove(
        projectFixtures[0].id,
        usersFixtures[0].id,
      );

      expect(result.id).toBe(projectFixtures[0].id);
    });

    it("Should throw NotFoundError when project not found", async () => {
      repository.delete.mockResolvedValue(null!);

      await expect(
        service.remove("non-existent-project-id", usersFixtures[0].id),
      ).rejects.toThrow(NotFoundError);
    });
  });
});

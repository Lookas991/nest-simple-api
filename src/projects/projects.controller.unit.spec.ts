import { Test, TestingModule } from "@nestjs/testing";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { ProjectResponseDto } from "./dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Reflector } from "@nestjs/core";
import { ExecutionContext } from "@nestjs/common";

describe("ProjectsController (Unit)", () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  const user = { id: "user123", email: "test@example.com" };
  const projectId = "proj123";

  const mockProject = new ProjectResponseDto({
    id: projectId,
    title: "My Project",
    ownerId: user.id,
  });

  const mockProjectsService = {
    findAllForUser: jest.fn().mockResolvedValue([mockProject]),
    findById: jest.fn().mockResolvedValue(mockProject),
    create: jest.fn().mockResolvedValue(mockProject),
    update: jest.fn().mockResolvedValue(mockProject),
    remove: jest.fn().mockResolvedValue({ id: mockProject.id }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        { provide: ProjectsService, useValue: mockProjectsService },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = user;
          return true;
        },
      })
      .compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  it("should get all projects for the user", async () => {
    const result = await controller.findAllForUser(user, {});

    expect(result).toEqual([mockProject]);
    expect(service.findAllForUser).toHaveBeenCalledWith(user.id, {});
  });

  it("should get one project by id", async () => {
    const result = await controller.findById(projectId, user);

    expect(result).toEqual(mockProject);
    expect(service.findById).toHaveBeenCalledWith(projectId, user.id);
  });

  it("should create a new project", async () => {
    const dto = { title: "My Project" };

    const result = await controller.create(dto, user);

    expect(result).toEqual(mockProject);
    expect(service.create).toHaveBeenCalledWith(dto, user.id);
  });

  it("should update a project", async () => {
    const dto = { title: "Updated Name" };
    const result = await controller.update(projectId, dto, user);

    expect(result).toBe(mockProject);
    expect(service.update).toHaveBeenCalledWith(projectId, user.id, dto);
  });

  it("should delete a project", async () => {
    const result = await controller.remove(projectId, user);

    expect(result).toEqual({ id: projectId });
    expect(service.remove).toHaveBeenCalledWith(projectId, user.id);
  });
});

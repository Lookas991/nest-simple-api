import { Test, TestingModule } from "@nestjs/testing";
import { TaskResponseDto } from "./dto";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { Reflector } from "@nestjs/core";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ExecutionContext } from "@nestjs/common";

describe("TasksController (Unit)", () => {
  let controller: TasksController;
  let service: TasksService;

  const user = {
    id: "user123",
    email: "test@example.com",
  };

  const taskId = "task123";

  const mockTask = new TaskResponseDto({
    id: taskId,
    title: "My Project",
    projectId: "proj123",
  });

  const mockTasksService = {
    findAllForProject: jest.fn().mockResolvedValue([mockTask]),
    findById: jest.fn().mockResolvedValue(mockTask),
    create: jest.fn().mockResolvedValue(mockTask),
    update: jest.fn().mockResolvedValue(mockTask),
    remove: jest.fn().mockResolvedValue({ id: mockTask.id }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
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

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it("should get all tasks for the project", async () => {
    const result = await controller.findAllForProject(
      mockTask.projectId,
      user,
      {},
    );

    expect(result).toEqual([mockTask]);
    expect(service.findAllForProject).toHaveBeenCalledWith(
      mockTask.projectId,
      user.id,
      {},
    );
  });

  it("should get one task by id", async () => {
    const result = await controller.findById(mockTask.id);

    expect(result).toEqual(mockTask);
    expect(service.findById).toHaveBeenCalledWith(mockTask.id);
  });

  it("should create a new task", async () => {
    const dto = {
      title: "My task",
      projectId: "project123",
    };

    const result = await controller.create(dto, user);

    expect(result).toEqual(mockTask);
    expect(service.create).toHaveBeenCalledWith(dto, user.id);
  });

  it("should update a task", async () => {
    const dto = {
      title: "Updated Name",
    };
    const result = await controller.update(taskId, dto);

    expect(result).toBe(mockTask);
    expect(service.update).toHaveBeenCalledWith(taskId, dto);
  });

  it("should delete a task", async () => {
    const result = await controller.remove(taskId);

    expect(result).toEqual({ id: taskId });
    expect(service.remove).toHaveBeenCalledWith(taskId);
  });
});

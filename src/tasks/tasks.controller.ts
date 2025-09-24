import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
  Query,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/user.decorator";
import { TasksService } from "./tasks.service";
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto } from "./dto";
import {
  ApiAuthEndpoint,
  ApiDeleteEndpoint,
  ApiGetByIdEndpoint,
  ApiPaginatedEndpoint,
  ApiTagsWithAuth,
  BaseQueryDto,
  PaginatedResponse,
} from "../common";
import { ApiParam } from "@nestjs/swagger";

ApiTagsWithAuth("Tasks");
@UseGuards(JwtAuthGuard)
@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiAuthEndpoint({
    summary: "Create a new task",
    bodyType: CreateTaskDto,
    responseType: TaskResponseDto,
    status: 201,
  })
  async create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: { id: string },
  ): Promise<TaskResponseDto> {
    return await this.tasksService.create(dto, user.id);
  }

  @Get("project/:projectId")
  @ApiPaginatedEndpoint("Get all tasks for a project", TaskResponseDto)
  async findAllForProject(
    @Param("projectId") projectId: string,
    @CurrentUser() user: { id: string },
    @Query() query: BaseQueryDto,
  ): Promise<PaginatedResponse<TaskResponseDto>> {
    return await this.tasksService.findAllForProject(projectId, user.id, query);
  }

  @Get(":id")
  @ApiGetByIdEndpoint("Get a task by ID", TaskResponseDto)
  @ApiParam({
    name: "id",
    example: "task-uuid-1234",
    required: true,
  })
  async findById(@Param("id") id: string): Promise<TaskResponseDto> {
    return await this.tasksService.findById(id);
  }

  @Patch(":id")
  @ApiAuthEndpoint({
    summary: "Update a task",
    bodyType: UpdateTaskDto,
    responseType: TaskResponseDto,
    status: 200,
  })
  @ApiParam({
    name: "id",
    example: "task-uuid-1234",
    required: true,
  })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return await this.tasksService.update(id, dto);
  }

  @Delete(":id")
  @ApiDeleteEndpoint("Delete a task")
  @ApiParam({
    name: "id",
    example: "task-uuid-1234",
    required: true,
  })
  async remove(@Param("id") id: string): Promise<TaskResponseDto> {
    return await this.tasksService.remove(id);
  }
}

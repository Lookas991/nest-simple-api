import { Injectable } from "@nestjs/common";

import { TasksDocument } from "./tasks.model";
import { CreateTaskDto, TaskResponseDto, UpdateTaskDto } from "./dto";
import { ProjectsService } from "../projects/projects.service";
import { NotFoundError } from "../common/errors/app-erros";
import { BaseQueryDto, PaginatedResponse } from "../common";
import { TasksRepository } from "./tasks.repository";

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(dto: CreateTaskDto, userId: string): Promise<TaskResponseDto> {
    const project = await this.projectsService.findById(dto.projectId, userId);

    if (!project) throw new NotFoundError(dto.projectId);

    const task = await this.tasksRepository.create({ ...dto });

    return new TaskResponseDto(task.toJSON());
  }

  async findAllForProject(
    projectId: string,
    userId: string,
    query: BaseQueryDto,
  ): Promise<PaginatedResponse<TaskResponseDto>> {
    await this.projectsService.findById(projectId, userId);
    const allowedSortFields: (keyof TasksDocument)[] = [
      "title",
      "description",
      "createdAt",
      "updatedAt",
      "done",
      "dueDate",
    ];

    const safeSortBy = allowedSortFields.includes(
      query.sortBy as keyof TasksDocument,
    )
      ? (query.sortBy as keyof TasksDocument)
      : undefined;

    const results = await this.tasksRepository.paginateTasks({
      ...query,
      sortBy: safeSortBy,
      projectId,
    });

    return {
      data: results.data.map((proj) => new TaskResponseDto(proj.toJSON())),
      pagination: results.pagination,
    };
  }

  async findById(id: string): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findById(id);

    if (!task) throw new NotFoundError(id);

    return new TaskResponseDto(task.toJSON());
  }

  async update(id: string, dto: UpdateTaskDto): Promise<TaskResponseDto> {
    await this.findById(id);

    const updated = await this.tasksRepository.update(id, dto);

    if (!updated) throw new Error(`Error updating ${id}`);

    return new TaskResponseDto(updated.toJSON());
  }

  async remove(id: string): Promise<TaskResponseDto> {
    await this.findById(id);

    await this.tasksRepository.delete(id);

    return new TaskResponseDto({ id });
  }
}

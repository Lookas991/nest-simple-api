import { Injectable } from "@nestjs/common";
import { ProjectsDocument } from "./projects.model";
import { CreateProjectDto, ProjectResponseDto, UpdateProjectDto } from "./dto";
import {
  NotFoundError,
  PaginatedResponse,
  BaseQueryDto,
  UnauthorizedAccessError,
} from "../common";
import { ProjectsRepository } from "./projects.repository";

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async create(
    dto: CreateProjectDto,
    ownerId: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.create({
      ...dto,
      ownerId,
    });

    return new ProjectResponseDto(project.toJSON());
  }

  async findAllForUser(
    userId: string,
    query: BaseQueryDto,
  ): Promise<PaginatedResponse<ProjectResponseDto>> {
    const allowedSortFields: (keyof ProjectsDocument)[] = [
      "title",
      "createdAt",
      "description",
      "updatedAt",
    ];

    const safeSortBy = allowedSortFields.includes(
      query.sortBy as keyof ProjectsDocument,
    )
      ? (query.sortBy as keyof ProjectsDocument)
      : undefined;

    const results = await this.projectsRepository.paginateProjects({
      ...query,
      sortBy: safeSortBy,
      userId,
    });

    return {
      data: results.data.map((proj) => new ProjectResponseDto(proj.toJSON())),
      pagination: results.pagination,
    };
  }

  async findById(id: string, userId: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findById(id);

    if (!project) throw new NotFoundError(id);
    if (project.ownerId !== userId) throw new UnauthorizedAccessError();

    return new ProjectResponseDto(project.toJSON());
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    await this.findById(id, userId);

    const updated = await this.projectsRepository.update(id, dto);

    if (!updated) throw new Error(`Error updating ${id}`);

    return new ProjectResponseDto(updated.toJSON());
  }

  async remove(id: string, userId: string): Promise<ProjectResponseDto> {
    await this.findById(id, userId);

    await this.projectsRepository.delete(id);

    return new ProjectResponseDto({ id });
  }
}

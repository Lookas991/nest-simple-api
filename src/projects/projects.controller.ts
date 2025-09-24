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
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiParam } from "@nestjs/swagger";
import { ProjectsService } from "./projects.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/user.decorator";
import { CreateProjectDto, ProjectResponseDto, UpdateProjectDto } from "./dto";
import {
  ApiAuthEndpoint,
  ApiDeleteEndpoint,
  ApiGetByIdEndpoint,
  ApiPaginatedEndpoint,
  ApiTagsWithAuth,
  BaseQueryDto,
  PaginatedResponse,
} from "../common";

@ApiTagsWithAuth("Projects")
@UseGuards(JwtAuthGuard)
@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectService: ProjectsService) {}

  @Post()
  @ApiAuthEndpoint({
    summary: "Create a new project",
    bodyType: CreateProjectDto,
    responseType: ProjectResponseDto,
    status: 201,
  })
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: { id: string },
  ): Promise<ProjectResponseDto> {
    return await this.projectService.create(dto, user.id);
  }

  @Get()
  @ApiPaginatedEndpoint("Get all projects for a user", ProjectResponseDto)
  async findAllForUser(
    @CurrentUser() user: { id: string },
    @Query() query: BaseQueryDto,
  ): Promise<PaginatedResponse<ProjectResponseDto>> {
    return await this.projectService.findAllForUser(user.id, query);
  }

  @Get(":id")
  @ApiGetByIdEndpoint("Get project by ID", ProjectResponseDto)
  @ApiParam({
    name: "id",
    example: "project-uuid-1234",
    required: true,
  })
  async findById(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() user: { id: string },
  ): Promise<ProjectResponseDto> {
    return await this.projectService.findById(id, user.id);
  }

  @Patch(":id")
  @ApiAuthEndpoint({
    summary: "Update a project",
    bodyType: UpdateProjectDto,
    responseType: ProjectResponseDto,
    status: 200,
  })
  @ApiParam({
    name: "id",
    example: "project-uuid-1234",
    required: true,
  })
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: { id: string },
  ): Promise<ProjectResponseDto> {
    return await this.projectService.update(id, user.id, dto);
  }

  @Delete(":id")
  @ApiDeleteEndpoint("Delete a project")
  @ApiParam({
    name: "id",
    example: "project-uuid-1234",
    required: true,
  })
  async remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() user: { id: string },
  ): Promise<ProjectResponseDto> {
    const project: ProjectResponseDto = await this.projectService.remove(
      id,
      user.id,
    );
    return project;
  }
}

import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ProjectsDocument } from "./projects.model";
import { BaseReporitory } from "../common";

export class ProjectsRepository extends BaseReporitory<ProjectsDocument> {
  constructor(@InjectModel("Project") model: Model<ProjectsDocument>) {
    super(model);
  }

  async paginateProjects(query: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: keyof ProjectsDocument;
    sortOrder?: "asc" | "desc";
    userId?: string;
  }) {
    const filter = query.userId ? { ownerId: query.userId } : {};
    return this.paginate({
      ...query,
      searchBy: ["title", "description"],
      filter,
    });
  }
}

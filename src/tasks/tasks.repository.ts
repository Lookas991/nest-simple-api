import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { TasksDocument } from "./tasks.model";
import { BaseReporitory } from "../common";

export class TasksRepository extends BaseReporitory<TasksDocument> {
  constructor(@InjectModel("Task") model: Model<TasksDocument>) {
    super(model);
  }

  async paginateTasks(query: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: keyof TasksDocument;
    sortOrder?: "asc" | "desc";
    projectId?: string;
  }) {
    const filter = query.projectId ? { projectId: query.projectId } : {};
    return this.paginate({
      ...query,
      searchBy: ["title", "description", "dueDate", "done"],
      filter,
    });
  }
}

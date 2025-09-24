import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UsersDocument } from "./users.model";
import { BaseReporitory } from "../common";

export class UsersRepository extends BaseReporitory<UsersDocument> {
  constructor(@InjectModel("User") model: Model<UsersDocument>) {
    super(model);
  }

  async findByEmail(email: string) {
    return await this.model.findOne({ email }).exec();
  }

  async paginateUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: keyof UsersDocument;
    sortOrder?: "asc" | "desc";
  }) {
    return await this.paginate({
      ...query,
      searchBy: ["email"],
    });
  }
}

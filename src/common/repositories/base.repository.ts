import { Model, FilterQuery } from "mongoose";

export type TQueryOptions<T> = {
  page?: number;
  limit?: number;
  sortBy?: keyof T;
  sortOrder?: "asc" | "desc";
  searchBy?: (keyof T)[];
  search?: string;
  filter?: FilterQuery<T>;
};

export type TPaginatedResponse<T> = {
  data: T[];
  pagination: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
};

export class BaseReporitory<T extends { id: string }> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    const created = new this.model(data);
    return await created.save();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOne(filter).exec();
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findOne({ id }).exec();
  }

  async update(id: string, update: Partial<T>): Promise<T | null> {
    return this.model.findOneAndUpdate({ id }, update, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    await this.model.deleteOne({ id }).exec();
  }

  async paginate({
    page = 1,
    limit = 10,
    sortBy,
    sortOrder = "asc",
    search,
    searchBy = [],
    filter = {},
  }: TQueryOptions<T> = {}): Promise<TPaginatedResponse<T>> {
    const skip = (page - 1) * limit;

    const searchWords = search
      ?.split(" ")
      .map((w) => w.trim())
      .filter(Boolean);

    // You must ensure `searchBy` only contains fields that are strings.
    // You can filter it here again just in case (replace with your schema’s string fields)
    const stringFields = ["title", "description", "name", "email"]; // adapt this!
    const validSearchBy = searchBy.filter((field) =>
      stringFields.includes(field as string),
    );

    const searchCondition =
      searchWords?.length && validSearchBy.length
        ? {
            $and: searchWords.map((word) => ({
              $or: validSearchBy.map((field) => ({
                [field]: { $regex: word, $options: "i" },
              })),
            })),
          }
        : {};

    const finalFilter: FilterQuery<T> = {
      ...filter,
      ...searchCondition,
    };

    const sortOption = sortBy
      ? ({ [sortBy]: sortOrder === "asc" ? 1 : -1 } as Record<string, 1 | -1>)
      : undefined;

    const [data, totalItems] = await Promise.all([
      this.model
        .find(finalFilter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(finalFilter).exec(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const itemCount = data.length;

    return {
      data,
      pagination: {
        totalItems,
        itemCount,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }
}

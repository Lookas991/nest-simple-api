import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class PaginationMetaDto {
  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  itemCount: number;

  @ApiProperty()
  itemsPerPage: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  currentPage: number;
}

export class PaginatedResponse<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  @Type(() => PaginationMetaDto)
  pagination: PaginationMetaDto;

  constructor(
    data: T[],
    pagination: {
      total: number;
      page: number;
      limit: number;
    },
  ) {
    this.data = data;
    this.pagination = {
      totalItems: pagination.total,
      itemCount: data.length,
      itemsPerPage: pagination.limit,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      currentPage: pagination.page,
    };
  }
}

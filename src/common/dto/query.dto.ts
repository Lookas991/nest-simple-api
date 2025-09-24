import { Transform } from "class-transformer";
import { PaginationDto } from "./pagination.dto";
import { IsIn, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class BaseQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value, obj }) => value || obj.sort)
  sortBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["asc", "desc"])
  @Transform(({ value, obj }) => value || obj.order)
  sortOrder?: "asc" | "desc";
}

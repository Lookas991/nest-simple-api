import { Expose, Type } from "class-transformer";
import { TaskResponseDto } from "../../tasks/dto";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProjectResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty()
  @Expose()
  ownerId: string;

  @ApiPropertyOptional({ isArray: true })
  @Expose()
  @Type(() => TaskResponseDto)
  tasks?: TaskResponseDto[];

  @ApiPropertyOptional()
  @Expose()
  createdAt?: Date;

  @ApiPropertyOptional()
  @Expose()
  updatedAt?: Date;

  constructor(partial: Partial<ProjectResponseDto>) {
    Object.assign(this, partial);
  }
}

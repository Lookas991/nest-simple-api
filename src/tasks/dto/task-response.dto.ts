import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class TaskResponseDto {
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
  done: boolean;

  @ApiProperty()
  @Expose()
  dueDate: Date;

  @ApiProperty()
  @Expose()
  projectId: string;

  @ApiPropertyOptional()
  @Expose()
  createdAt?: Date;

  @ApiPropertyOptional()
  @Expose()
  updatedAt?: Date;

  constructor(partial: Partial<TaskResponseDto>) {
    Object.assign(this, partial);
  }
}

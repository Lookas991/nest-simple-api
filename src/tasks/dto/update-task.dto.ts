import { ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "@nestjs/mapped-types";
import { CreateTaskDto } from "./create-task.dto";

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({ example: "Updated task title", maxLength: 100 })
  title?: string;

  @ApiPropertyOptional({ example: "Updated task description", maxLength: 1000 })
  description?: string;

  @ApiPropertyOptional({ example: "Updated project's ID" })
  projectId?: string;

  @ApiPropertyOptional({ example: "false" })
  done?: boolean;

  @ApiPropertyOptional({ example: `${new Date()}` })
  dueDate?: Date;
}

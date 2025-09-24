import { PartialType } from "@nestjs/mapped-types";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { CreateProjectDto } from "./create-project.dto";
import { IsOptional, IsString } from "class-validator";

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional({ example: "Updated project title" })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: "Updated project description" })
  @IsString()
  @IsOptional()
  description?: string;
}

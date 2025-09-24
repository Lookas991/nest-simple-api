import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateTaskDto {
  @ApiProperty({ example: "Clearing the work site", maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({
    example: "Clearing the work site of project for building 53c...",
    maxLength: 1000,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: "412f1-12df1-1d12e-124ac" })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiPropertyOptional({ example: "true" })
  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @ApiPropertyOptional({ example: `${new Date()}` })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;
}

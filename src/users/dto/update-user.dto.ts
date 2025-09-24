import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";
import { TUserProfile } from "./user-response.dto";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional()
  password?: string;

  @ApiPropertyOptional()
  userName?: string;

  @ApiPropertyOptional()
  profile?: TUserProfile;
}

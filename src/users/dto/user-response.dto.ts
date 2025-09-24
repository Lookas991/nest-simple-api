import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export type TUserProfile = {
  avatarId?: string;
  coverId?: string;
};

@Expose()
export class UserResponseDto {
  @ApiProperty({ example: "412f1-12df1-1d12e-124ac" })
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: "jogn@doe.com" })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiPropertyOptional()
  profile?: TUserProfile;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;

  constructor(partial: Partial<UserResponseDto>) {
    if (partial["password"]) delete partial["password"];
    Object.assign(this, partial);
  }
}

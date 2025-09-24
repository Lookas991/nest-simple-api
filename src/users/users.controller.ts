import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/user.decorator";
import { UserResponseDto } from "./dto";
import { ApiAuthEndpoint, ApiTagsWithAuth } from "../common";
import { ApiExtraModels } from "@nestjs/swagger";

@ApiTagsWithAuth("Users")
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor() {}

  @Get("me")
  @ApiExtraModels(UserResponseDto)
  @ApiAuthEndpoint({
    summary: "Get the current user",
    status: 200,
  })
  getMe(@CurrentUser() user: { id: string; email: string }) {
    return new UserResponseDto({
      id: user.id,
      email: user.email,
    });
  }
}

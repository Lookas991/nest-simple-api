import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  ConflictException,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./user.decorator";
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  LoginResponseDto,
  RegisterResponseDto,
} from "./dto";
import { CreateUserDto, UserResponseDto } from "../users/dto";
import { ApiTags } from "@nestjs/swagger";
import { ApiAuthEndpoint } from "../common";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @ApiAuthEndpoint({
    summary: "Login",
    bodyType: LoginDto,
    responseType: LoginResponseDto,
    status: 201,
    auth: false,
  })
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) throw new ConflictException("Invalid credentials");

    const token = await this.authService.login(user);
    res.cookie("access_token", token.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // "strict"
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    return {
      message: "Login successfully",
    };
  }

  @Post("register")
  @ApiAuthEndpoint({
    summary: "Register a new user",
    bodyType: RegisterDto,
    responseType: RegisterResponseDto,
    status: 201,
    auth: false,
  })
  async register(
    @Body() body: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterResponseDto> {
    const token = await this.authService.register(body);

    res.cookie("access_token", token.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // "strict"
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    return {
      message: "Registered successfully",
    };
  }

  @Post("logout")
  @ApiAuthEndpoint({
    summary: "Logout current user",
    responseType: LoginResponseDto,
  })
  async logout(
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    res.clearCookie("access_token");
    return {
      message: "Logged out successfully",
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  @ApiAuthEndpoint({
    summary: "Get current user",
    responseType: UserResponseDto,
  })
  me(@CurrentUser() user: any) {
    return new UserResponseDto(user);
  }
}

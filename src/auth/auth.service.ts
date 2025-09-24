import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { Injectable } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { UsersRepository } from "../users/users.repository";
import { RegisterResponseDto } from "./dto";
import { CreateUserDto } from "../users/dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) return null;

    const match = await bcrypt.compare(pass, user.password);
    return match ? user : null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
    };
  }

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return this.login(user);
  }
}

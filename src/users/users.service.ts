import { ConflictException, Injectable } from "@nestjs/common";
import { CreateUserDto, UpdateUserDto, UserResponseDto } from "./dto";
import * as bcrypt from "bcrypt";
import { NotFoundError } from "../common/errors/app-erros";
import { ConfigService } from "../config/config.service";
import { UsersRepository } from "./users.repository";

// TODO Admin guard
@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing?.email === dto.email)
      throw new ConflictException("Email already registered");

    const hashed = await bcrypt.hash(dto.password, this.config.saltRounds);
    const created = await this.userRepository.create({
      ...dto,
      password: hashed,
    });

    return new UserResponseDto(created.toJSON());
  }

  async findById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundError(id);

    return new UserResponseDto(user.toJSON());
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new NotFoundError(email);

    return new UserResponseDto(user.toJSON());
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto | null> {
    await this.findById(id);

    const updated = await this.userRepository.update(id, dto);

    if (!updated) throw new Error(`Error updating ${id}`);

    return new UserResponseDto(updated.toJSON());
  }
}

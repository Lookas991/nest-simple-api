import mongoose from "mongoose";
import { ConflictException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { NotFoundError } from "../common";
import { CreateUserDto, UserResponseDto } from "./dto";
import { UsersService } from "./users.service";
import { UsersRepository } from "./users.repository";
import { getUserFixtures } from "../../test/fixtures";
import {
  closeDatabase,
  mongooseConnect,
  resetDatabase,
  TestUtilsModule,
} from "../../test/utils";

describe("UsersService (Integration)", () => {
  let module: TestingModule;
  let usersService: UsersService;

  let dto: CreateUserDto;
  let created: UserResponseDto;
  let userFixtures: any[];

  beforeAll(async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI not set");

    await mongooseConnect(uri);

    module = await Test.createTestingModule({
      imports: [TestUtilsModule.register({ useMocks: false })],
    }).compile();

    usersService = module.get<UsersService>(UsersService);

    userFixtures = await getUserFixtures();

    dto = {
      email: userFixtures[0].email,
      password: "password123",
    };
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe("Connection Check", () => {
    it("should be connected to MongoDB", async () => {
      expect(mongoose.connection.readyState).toBe(1);
    });
  });

  describe("Create a user", () => {
    it("should create a user and return <UserResponseDto> as a result", async () => {
      created = await usersService.create(dto);

      expect(created).toBeDefined();
      expect(created.email).toBe(dto.email);
      expect(created).not.toHaveProperty("password");
    });

    it("should throw Error when email already exists", async () => {
      await expect(usersService.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe("Find by email", () => {
    it("returns an user based on email", async () => {
      const user = await usersService.findByEmail(dto.email);

      expect(user).toBeDefined();
      expect(user?.email).toBe(dto.email);
    });

    it("should throw NotFoundError if user not found", async () => {
      await expect(
        usersService.findByEmail("non-existent@test.com"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("Find by id", () => {
    it("return an user based on id", async () => {
      const user = await usersService.findById(created.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(created.id);
      expect(user?.email).toBe(created.email);
    });
    it("should throw NotFoundError if use not found", async () => {
      await expect(usersService.findById("non-existent-id")).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});

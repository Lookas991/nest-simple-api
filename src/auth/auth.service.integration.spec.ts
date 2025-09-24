import mongoose from "mongoose";
import * as bcrypt from "bcrypt";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersRepository } from "../users/users.repository";
import { TestUtilsModule } from "../../test/utils/test-utils.module";
import {
  closeDatabase,
  resetDatabase,
  mongooseConnect,
} from "../../test/utils";

const userDto = {
  email: "testuser@example.com",
  password: "testpass123",
};

describe("AuthService (Integration)", () => {
  let module: TestingModule;
  let authService: AuthService;
  let usersRepository: UsersRepository;

  beforeAll(async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI not set");

    await mongooseConnect(uri);

    module = await Test.createTestingModule({
      imports: [TestUtilsModule.register({ useMocks: false })],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersRepository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe("Connection Check", () => {
    it("should be connected to MongoDB", () => {
      expect(mongoose.connection.readyState).toBe(1);
    });
  });

  describe("Should register and login a user", () => {
    it("Success", async () => {
      const result = await authService.register(userDto);
      expect(result).toHaveProperty("access_token");
      expect(typeof result.access_token).toBe("string");
    });
  });

  describe("Validate user", () => {
    it("should validate user with correct credentials", async () => {
      const password = "securepass";
      const hashed = await bcrypt.hash(password, 10);
      await usersRepository.create({
        email: "valid@example.com",
        password: hashed,
      });

      const result = await authService.validateUser(
        "valid@example.com",
        password,
      );
      expect(result).toBeTruthy();
      expect(result?.email).toBe("valid@example.com");
    });

    it("should return null for invalid credentials", async () => {
      await usersRepository.create({
        email: "baduser@example.com",
        password: await bcrypt.hash("realpass", 10),
      });

      const result = await authService.validateUser(
        "baduser@example.com",
        "wrongpass",
      );
      expect(result).toBeNull();
    });

    describe("Login", () => {
      it("should return access_token", async () => {
        const result = await authService.login({
          email: "valid@example.com",
          password: "securepass",
        });

        expect(result).toBeTruthy();
        expect(typeof result?.access_token).toBe("string");
      });
    });
  });
});

import * as bcrypt from "bcrypt";

import { Test } from "@nestjs/testing";
import { createMockMongooseDoc, TestUtilsModule } from "../../test/utils";
import { UsersService } from "../../src/users/users.service";
import { UsersRepository } from "../../src/users/users.repository";
import { getUserFixtures } from "../../test/fixtures";
import { NotFoundError } from "../common";
import { UserResponseDto } from "./dto";

describe("UsersService (Unit)", () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;
  let usersFixtures;

  beforeAll(async () => {
    usersFixtures = await getUserFixtures();
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TestUtilsModule.register({
          useMocks: true,
        }),
      ],
    }).compile();

    service = moduleRef.get(UsersService);
    repository = moduleRef.get(UsersRepository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Create user", () => {
    it("Success", async () => {
      const userDto = { email: "new@test.com", password: "plainpassword" };
      let passedPassword;

      repository.create.mockImplementation(async (data) => {
        passedPassword = data.password;
        return createMockMongooseDoc({
          id: "some-uuid",
          email: data.email,
          password: data.password,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      });

      const result = await service.create(userDto);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.email).toBe(userDto.email);
      expect(bcrypt.compareSync(userDto.password, passedPassword)).toBe(true);
    });
  });

  describe("Find by id", () => {
    it("Success", async () => {
      repository.findById.mockResolvedValue(
        createMockMongooseDoc(usersFixtures[0]),
      );

      const result = await service.findById(usersFixtures[0].id);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result?.id).toBe(usersFixtures[0].id);
    });

    it("Should throw NotFoundError when user not found", async () => {
      const id = "non-existent-id";
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundError);
      await expect(service.findById(id)).rejects.toThrow(
        `Object with ID ${id} not found`,
      );
    });
  });

  describe("Find by email", () => {
    it("Success", async () => {
      repository.findByEmail.mockResolvedValue(
        createMockMongooseDoc(usersFixtures[0]),
      );

      const result = await service.findByEmail(usersFixtures[0].email);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result?.email).toBe(usersFixtures[0].email);
    });

    it("Should throw NotFoundError when user not found", async () => {
      repository.findById.mockResolvedValue(null);
      const email = "non-existent-email";

      await expect(service.findByEmail(email)).rejects.toThrow(NotFoundError);
      await expect(service.findById(email)).rejects.toThrow(
        `Object with ID ${email} not found`,
      );
    });
  });
});

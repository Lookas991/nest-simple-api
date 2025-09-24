import * as bcrypt from "bcrypt";
import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { UsersRepository } from "../users/users.repository";
import { TestUtilsModule } from "../../test/utils/test-utils.module";
import { getUserFixtures } from "../../test/fixtures";

describe("AuthService (Unit)", () => {
  let service: AuthService;
  let usersRepository: UsersRepository;
  let jwtService: JwtService;
  let usersService: UsersService;

  let userFixtures: any[];

  beforeAll(async () => {
    userFixtures = await getUserFixtures();
  });

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [TestUtilsModule.register({ useMocks: true })],
    }).compile();

    service = moduleRef.get(AuthService);
    usersRepository = moduleRef.get(UsersRepository);
    jwtService = moduleRef.get(JwtService);
    usersService = moduleRef.get(UsersService);
  });

  describe("validateUser()", () => {
    it("should return user if password matches", async () => {
      const user = {
        ...userFixtures[0],
        password: await bcrypt.hash("test123", 10),
      };
      jest.spyOn(usersRepository, "findByEmail").mockResolvedValue(user);

      const result = await service.validateUser(user.email, "test123");
      expect(result).toEqual(user);
    });

    it("should return null if user not found", async () => {
      jest.spyOn(usersRepository, "findByEmail").mockResolvedValue(null);

      const result = await service.validateUser("wrong@test.com", "password");
      expect(result).toBeNull();
    });

    it("should return null if password does not match", async () => {
      const user = {
        ...userFixtures[0],
        password: await bcrypt.hash("test123", 10),
      };
      jest.spyOn(usersRepository, "findByEmail").mockResolvedValue(user);

      const result = await service.validateUser(user.email, "wrongpass");
      expect(result).toBeNull();
    });
  });

  describe("login()", () => {
    it("should return access_token", async () => {
      const user = userFixtures[0];
      const signSpy = jest
        .spyOn(jwtService, "sign")
        .mockReturnValue("mocked.jwt.token");

      const result = await service.login(user);
      expect(signSpy).toHaveBeenCalledWith({ email: user.email, sub: user.id });
      expect(result).toEqual({ access_token: "mocked.jwt.token" });
    });
  });

  describe("register()", () => {
    it("should call UsersService.create and return JWT token", async () => {
      const dto = { email: "new@test.com", password: "secret" };
      const createdUser = { ...userFixtures[0], ...dto };

      jest.spyOn(usersService, "create").mockResolvedValue(createdUser);
      jest.spyOn(jwtService, "sign").mockReturnValue("mocked.jwt.token");

      const result = await service.register(dto);
      expect(result).toEqual({ access_token: "mocked.jwt.token" });
    });
  });
});

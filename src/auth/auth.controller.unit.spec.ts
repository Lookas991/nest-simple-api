import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { UserResponseDto } from "../users/dto";
import { Response } from "express";

describe("AuthController (Unit)", () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      // Mock guard for @UseGuards so it doesn’t block tests
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should return token on successful login", async () => {
      const mockResponse = {
        cookie: jest.fn(),
      } as any;
      const dto = { email: "test@example.com", password: "pass123" };
      const user = { id: "user123", email: dto.email };
      const loginResponse = { message: "Login successfully" };

      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue(loginResponse);

      const result = await controller.login(dto, mockResponse);

      expect(authService.validateUser).toHaveBeenCalledWith(
        dto.email,
        dto.password,
      );
      expect(authService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual(loginResponse);
    });

    it("should throw error on invalid credentials", async () => {
      const mockResponse = {
        cookie: jest.fn(),
      } as any;
      const dto = { email: "wrong@example.com", password: "badpass" };

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(controller.login(dto, mockResponse)).rejects.toThrow(
        "Invalid credentials",
      );
      expect(authService.validateUser).toHaveBeenCalledWith(
        dto.email,
        dto.password,
      );
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe("register", () => {
    it("should register a user", async () => {
      const mockResponse = {
        cookie: jest.fn(),
      } as any;
      const dto = { email: "newuser@example.com", password: "newpass" };
      const registrationResult = {
        message: "Registered successfully",
      };

      mockAuthService.register.mockResolvedValue(registrationResult);

      const result = await controller.register(dto, mockResponse);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(registrationResult);
    });
  });

  describe("me", () => {
    it("should return user info wrapped in UserResponseDto", () => {
      const user = { id: "user123", email: "test@example.com" };
      const expectedDto = new UserResponseDto(user);

      const result = controller.me(user);

      expect(result).toEqual(expectedDto);
    });
  });
});

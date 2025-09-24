import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ExecutionContext } from "@nestjs/common";
import { TestUtilsModule } from "../../test/utils/test-utils.module";

describe("UsersController (Unit)", () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestUtilsModule.register({ useMocks: true })],
      controllers: [UsersController],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: "abc123", email: "unit@example.com" };
          return true;
        },
      })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it("should return current user info", () => {
    const reqUser = { id: "abc123", email: "unit@example.com" };
    const result = controller.getMe(reqUser);
    expect(result).toEqual(reqUser);
  });
});

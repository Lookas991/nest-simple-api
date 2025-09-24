import { Test, TestingModule } from "@nestjs/testing";
import { UploadService } from "../../src/upload/upload.service";
import { ConfigModule } from "../../src/config/config.module";

jest.mock("@aws-sdk/client-s3");

describe("UploadService Integration", () => {
  let uploadService: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [UploadService],
    }).compile();

    uploadService = module.get<UploadService>(UploadService);
  });

  it("uploadFile returns a valid key", async () => {
    // Mock s3Client.send
    const sendMock = jest.fn().mockResolvedValue({});
    (uploadService as any).s3.send = sendMock;

    const file = {
      originalname: "test.png",
      mimetype: "image/png",
      size: 1024,
      buffer: Buffer.from("test"),
    } as Express.Multer.File;

    const key = await uploadService.uploadFile(file, "user42", "avatar");
    expect(key).toContain("avatars/user42_avatar.png");
    expect(sendMock).toHaveBeenCalled();
  });
});

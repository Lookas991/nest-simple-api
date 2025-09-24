import { Test, TestingModule } from "@nestjs/testing";
import { UploadService } from "../../src/upload/upload.service";
import { ConfigService } from "../../src/config/config.service";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Mock the entire S3 client module once
jest.mock("@aws-sdk/client-s3");

// Mock getSignedUrl function from s3-request-presigner once at the top
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

describe("UploadService", () => {
  let service: UploadService;
  let configService: Partial<ConfigService>;
  let s3SendMock: jest.Mock;
  let getSignedUrlMock: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks(); // reset mocks before each test

    s3SendMock = jest.fn();
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: s3SendMock,
    }));

    configService = {
      s3Bucket: "test-bucket",
      s3AccessKey: "test-access-key",
      s3SecretKey: "test-secret-key",
      s3Region: "us-east-1",
      s3Endpoint: undefined,
      maxFileSize: 5 * 1024 * 1024,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);

    const s3Presigner = require("@aws-sdk/s3-request-presigner");
    getSignedUrlMock = s3Presigner.getSignedUrl;
  });

  it("should upload file and return key", async () => {
    s3SendMock.mockResolvedValueOnce({}); // mock single call

    const fakeFile = {
      originalname: "avatar.png",
      mimetype: "image/png",
      size: 1024,
      buffer: Buffer.from("test"),
    } as Express.Multer.File;

    const key = await service.uploadFile(fakeFile, "user123", "avatar");

    expect(key).toMatch(/^avatars\/user123_avatar\.png$/);
    expect(s3SendMock).toHaveBeenCalled();

    const callArg = s3SendMock.mock.calls.find(
      (call) => call[0] instanceof PutObjectCommand,
    );
    expect(callArg[0]).toBeInstanceOf(PutObjectCommand);
  });

  it("should throw on too large file", async () => {
    const bigFile = {
      originalname: "file.png",
      mimetype: "image/png",
      size: 6 * 1024 * 1024,
      buffer: Buffer.from("test"),
    } as Express.Multer.File;

    await expect(
      service.uploadFile(bigFile, "user1", "attachment"),
    ).rejects.toThrow(/File size exceeds limit/);
  });

  it("should throw on unsupported mimetype", async () => {
    const badFile = {
      originalname: "file.exe",
      mimetype: "application/octet-stream",
      size: 1024,
      buffer: Buffer.from("test"),
    } as Express.Multer.File;

    await expect(
      service.uploadFile(badFile, "user1", "attachment"),
    ).rejects.toThrow(/Unsupported file type/);
  });

  it("should generate signed URL", async () => {
    getSignedUrlMock.mockResolvedValue("https://signed.url/test");

    const url = await service.getSignedUrl("avatars/user123_avatar.png");

    expect(url).toBe("https://signed.url/test");
    expect(getSignedUrlMock).toHaveBeenCalled();
  });

  it("should delete file", async () => {
    s3SendMock.mockResolvedValueOnce({});

    await service.deleteFile("avatars/user123_avatar.png");

    expect(s3SendMock).toHaveBeenCalled();
    expect(
      s3SendMock.mock.calls.find(
        (call) => call[0] instanceof DeleteObjectCommand,
      )[0],
    ).toBeInstanceOf(DeleteObjectCommand);
  });
});

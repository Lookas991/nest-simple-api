import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "../config/config.service";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  BucketLocationConstraint,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { extname, basename } from "path";
import { Readable } from "stream";
import * as uuid from "uuid";

export type TFileType = "avatar" | "cover" | "attachment";

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly MAX_FILE_SIZE: number;
  private readonly ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];
  // Flag to track bucket initialization
  private bucketInitialized = false;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.s3Bucket as string;
    if (!this.bucket) {
      throw new Error("S3_BUCKET is not defined in configuration");
    }

    this.MAX_FILE_SIZE = this.configService.maxFileSize as number;
    if (!this.MAX_FILE_SIZE) {
      throw new Error("MAX_FILE_SIZE is not defined in configuration");
    }

    const accessKeyId = this.configService.s3AccessKey;
    const secretAccessKey = this.configService.s3SecretKey;
    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "S3_ACCESS_KEY or S3_SECRET_KEY is not defined in configuration",
      );
    }

    this.s3 = new S3Client({
      region: this.configService.s3Region,
      endpoint: this.configService.s3Endpoint,
      forcePathStyle: !!this.configService.s3Endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  //Checks if the bucket exists and creates it if it doesn't
  private async initializeBucket(): Promise<void> {
    // Skip if already initialized
    if (this.bucketInitialized) {
      return;
    }

    try {
      // Validate bucket name (S3 bucket names must be 3–63 characters, lowercase, etc.)
      if (!this.bucket.match(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/)) {
        throw new Error("Invalid S3 bucket name");
      }

      // Check if bucket exists
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket ${this.bucket} already exists`);
      this.bucketInitialized = true;
    } catch (error) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        // Bucket doesn't exist, create it
        try {
          await this.s3.send(
            new CreateBucketCommand({
              Bucket: this.bucket,
              CreateBucketConfiguration: {
                LocationConstraint:
                  (this.configService.s3Region as BucketLocationConstraint) ||
                  ("eu-east-1" as BucketLocationConstraint),
              },
            }),
          );
          this.logger.log(`Bucket ${this.bucket} created successfully`);
          this.bucketInitialized = true;
        } catch (createError) {
          this.logger.error(
            `Failed to create bucket ${this.bucket}: ${createError.message}`,
          );
          throw new InternalServerErrorException(
            `Failed to create bucket: ${createError.message}`,
          );
        }
      } else {
        this.logger.error(`Failed to check bucket existence: ${error.message}`);
        throw new InternalServerErrorException(
          `Failed to verify bucket: ${error.message}`,
        );
      }
    }
  }

  // Sanitizes and shortens filenames for S3
  private sanitizeFilename(filename: string, maxLength = 50): string {
    const name = basename(filename, extname(filename))
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\s+/g, "_");

    const truncated = name.length > maxLength ? name.slice(0, maxLength) : name;
    return truncated;
  }

  // Generates S3 key with folder structure
  private generateKey(
    userId: string | number,
    fileType: TFileType,
    originalName: string,
  ): string {
    const extension = extname(originalName).toLowerCase();
    const safeUserId = String(userId);

    if (fileType === "avatar") {
      return `avatars/${safeUserId}_avatar${extension}`;
    }
    if (fileType === "cover") {
      return `covers/${safeUserId}_cover${extension}`;
    }

    // For attachments
    const safeName = this.sanitizeFilename(originalName);
    return `attachments/${safeUserId}_${safeName}${extension}`;
  }

  // Uploads file to S3
  async uploadFile(
    file: Express.Multer.File,
    userId: string | number,
    fileType: TFileType,
  ): Promise<string> {
    // Ensure bucket exists
    await this.initializeBucket();

    if (!file) {
      throw new BadRequestException("No file provided");
    }
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds limit of ${this.MAX_FILE_SIZE / (1024 * 1024)} MB`,
      );
    }
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException("Unsupported file type");
    }

    const key = this.generateKey(userId, fileType, file.originalname);

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ServerSideEncryption: "AES256",
      });

      await this.s3.send(command);
      this.logger.log(`Successfully uploaded file: ${key}`);
      return key;
    } catch (error) {
      this.logger.error(`Failed to upload file`, error.stack);
      throw new InternalServerErrorException("Failed to upload file to S3");
    }
  }

  // Generates signed URL
  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    // Ensure bucket exists
    await this.initializeBucket();

    if (!key || typeof key !== "string" || !key.trim()) {
      throw new BadRequestException("Invalid or missing file key");
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return await getSignedUrl(this.s3, command, {
        expiresIn: expiresInSeconds,
      });
    } catch (error) {
      this.logger.error(`Failed to generate signed URL`, error.stack);
      throw new InternalServerErrorException("Failed to generate signed URL");
    }
  }

  // Deletes file from S3

  async deleteFile(key: string): Promise<void> {
    // Ensure bucket exists
    await this.initializeBucket();

    if (!key || typeof key !== "string" || !key.trim()) {
      throw new BadRequestException("Invalid or missing file key");
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3.send(command);
      this.logger.log(`Deleted file: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file`, error.stack);
      throw new InternalServerErrorException("Failed to delete file");
    }
  }

  // Retrieves file stream (inline or attachment)
  async getFileStreamWithMeta(
    key: string,
    asAttachment = false,
  ): Promise<{
    stream: Readable;
    contentType: string;
    contentLength?: number;
    contentDisposition?: string;
  }> {
    // Ensure bucket exists
    await this.initializeBucket();

    if (!key || typeof key !== "string" || !key.trim()) {
      throw new BadRequestException("Invalid or missing file key");
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const { Body, ContentType, ContentLength } = await this.s3.send(command);

      const contentDisposition = asAttachment
        ? `attachment; filename="${basename(key)}"`
        : undefined;

      return {
        stream: Body as Readable,
        contentType: ContentType || "application/octet-stream",
        contentLength: ContentLength,
        contentDisposition,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get file stream: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to retrieve file: ${error.message}`,
      );
    }
  }
}

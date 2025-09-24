import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";

@Injectable()
export class ConfigService {
  constructor(private readonly config: NestConfigService) { }

  // App
  get nodeEnv(): string {
    return this.config.get<string>("NODE_ENV", "development");
  }

  get port(): number {
    return this.config.get<number>("PORT", 3000);
  }

  // Auth
  get jwtSecret(): string {
    return this.config.get<string>("JWT_SECRET") as string;
  }

  get jwtExpiresIn(): string {
    return this.config.get<string>("JWT_EXPIRES_IN", "1d");
  }

  get saltRounds(): number {
    return parseInt(this.config.get<string>("SALT_ROUNDS", "10"), 10);
  }

  // Database
  get dbUri(): string | undefined {
    return this.config.get<string>("MONGO_URI");
  }

  get dbName(): string | undefined {
    return this.config.get<string>("DB_NAME");
  }

  // S3
  get s3Endpoint(): string | undefined {
    return this.config.get<string>("S3_ENDPOINT");
  }

  get s3Bucket(): string | undefined {
    return this.config.get<string>("S3_BUCKET");
  }

  get s3Region(): string | undefined {
    return this.config.get<string>("S3_REGION");
  }

  get s3AccessKey(): string | undefined {
    return this.config.get<string>("S3_ACCESS_KEY");
  }

  get s3SecretKey(): string | undefined {
    return this.config.get<string>("S3_SECRET_KEY");
  }

  get maxFileSize(): number | undefined {
    return this.config.get<number>("MAX_FILE_SIZE", 5 * 1024 * 1024);
  }

  get frontendUrl(): string | undefined {
    return this.config.get<string>("FRONTEND_URL");
  }
}

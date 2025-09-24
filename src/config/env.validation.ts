import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),

  FRONTEND_URL: z.string().url().default("http://localhost:5173"),

  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  SALT_ROUNDS: z.coerce.number().default(10),

  MONGO_URI: z.string().url().default("mongodb://localhost:27017/task_db"),
  DB_NAME: z.string().default("task_db"),

  S3_ENDPOINT: z.string().url().default("http://localhost:4566"),
  S3_BUCKET: z.string().default("dev-uploads"),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY: z.string().default("localstack"),
  S3_SECRET_KEY: z.string().default("localstack"),
  MAX_FILE_SIZE: z.coerce.number().default(5 * 1024 * 1024),
});

export function validateEnv(config: Record<string, any>) {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.format());
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}

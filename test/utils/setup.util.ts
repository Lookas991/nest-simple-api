import * as mongoose from "mongoose";
import * as cookieParser from "cookie-parser";
import { Reflector } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import { AppModule } from "../../src/app.module";
import { useContainer } from "class-validator";
import { ConfigService as AppConfigService } from "../../src/config/config.service";
import { GlobalExceptionFilter, TransformInterceptor } from "../../src/common";
import { registerTestCollections } from "./db.utils";

export const setupTestApp = async (): Promise<INestApplication> => {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();

  app.use(cookieParser());

  // Load env from Nest ConfigService
  const configService = app.get(AppConfigService);

  // CORS, global pipes, filters, interceptors
  app.enableCors({ origin: "*", credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor(),
  );

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await app.init();

  // Connect mongoose to the test MongoDB URI
  const mongoUri = configService.dbUri;
  if (!mongoUri)
    throw new Error("[setupTestApp] MONGO_URI not found in ConfigService");

  await mongoose.connect(mongoUri);
  await registerTestCollections();

  return app;
};

import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { TransformInterceptor } from "./common";
import { ConfigService } from "./config/config.service";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global congifuration object
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api");

  // securing http headers
  app.use(helmet());

  app.use(cookieParser());

  // Enable CORS for React frontend
  app.enableCors({
    origin: config.frontendUrl,
    credentials: true,
  });

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

  app.enableShutdownHooks();

  // Swagger config
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Task & Project Manager API")
    .setDescription(
      "Full-featured backend API for managing tasks and projects.",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  if (config.nodeEnv !== "production") {
    SwaggerModule.setup("api/docs", app, document);
    app.use("/api-json", (_req, res) => res.json(document));
  }

  await app.listen(config.port ?? 3000);
  console.log(`App running at http://localhost:${config.port}/api`);
}
bootstrap();

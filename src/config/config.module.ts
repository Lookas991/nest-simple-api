import { Global, Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { ConfigService } from "./config.service";
import { validateEnv } from "./env.validation";

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,

      envFilePath: process.env.NODE_ENV
        ? [`.env.${process.env.NODE_ENV}`, ".env"]
        : [".env"],

      validate: validateEnv,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}

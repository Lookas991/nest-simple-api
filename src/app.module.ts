import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { ProjectsModule } from "./projects/projects.module";
import { TasksModule } from "./tasks/tasks.module";
import { ConfigModule } from "./config/config.module";
import { ConfigService } from "./config/config.service";
import { MongooseModule } from "@nestjs/mongoose";
import { UploadModule } from "./upload/upload.module";
import { ThrottlerModule, seconds } from "@nestjs/throttler";

@Module({
  imports: [
    ConfigModule,
    // MongoDB connection using custom config
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.dbUri,
        dbName: config.dbName,
      }),
      inject: [ConfigService],
    }),
    // Throttler Module to protect from brute force attacks
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: seconds(60), // time-to-live in seconds
          limit: 10, // max requests within ttl
        }
      ]
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

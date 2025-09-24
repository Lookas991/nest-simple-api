import { JwtModule, JwtService } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { ConfigService as NestConfigService } from "@nestjs/config";

import { UserSchema } from "../../src/users/users.schema";
import { TaskSchema } from "../../src/tasks/tasks.schema";
import { ProjectSchema } from "../../src/projects/projects.schema";

import { UsersRepository } from "../../src/users/users.repository";
import { TasksRepository } from "../../src/tasks/tasks.repository";
import { ProjectsRepository } from "../../src/projects/projects.repository";

import { UsersService } from "../../src/users/users.service";
import { AuthService } from "../../src/auth/auth.service";
import { TasksService } from "../../src/tasks/tasks.service";
import { ProjectsService } from "../../src/projects/projects.service";

import { ConfigService } from "../../src/config/config.service";
import { validateEnv } from "../../src/config/env.validation";
import { ConfigModule } from "../../src/config/config.module";

@Module({})
export class TestUtilsModule {
  static register(
    options: { useMocks?: boolean; uri?: string } = {},
  ): DynamicModule {
    const { useMocks = true, uri = process.env.MONGO_URI as string } = options;

    const schemaImports = useMocks
      ? []
      : [
          ConfigModule,
          JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
              const secret = config.jwtSecret || "testsecret";
              return {
                secret,
                signOptions: { expiresIn: "1h" },
              };
            },
          }),
          NestConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ".env.test",
            validate: validateEnv,
          }),
          MongooseModule.forRoot(uri),
          MongooseModule.forFeature([
            { name: "User", schema: UserSchema },
            { name: "Project", schema: ProjectSchema },
            { name: "Task", schema: TaskSchema },
          ]),
        ];

    const providers = useMocks
      ? [
          {
            provide: UsersRepository,
            useValue: {
              create: jest.fn(),
              findOne: jest.fn(),
              findById: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              paginate: jest.fn(),
              findByEmail: jest.fn(),
              paginateUsers: jest.fn(),
            },
          },
          {
            provide: ProjectsRepository,
            useValue: {
              create: jest.fn(),
              findOne: jest.fn(),
              findById: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              paginate: jest.fn(),
              paginateProjects: jest.fn(),
            },
          },
          {
            provide: TasksRepository,
            useValue: {
              create: jest.fn(),
              findOne: jest.fn(),
              findById: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              paginate: jest.fn(),
              paginateTasks: jest.fn(),
            },
          },
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn().mockReturnValue("mocked.jwt.token"),
            },
          },
          AuthService,
          UsersService,
          ProjectsService,
          TasksService,
          ConfigService,
          NestConfigService,
        ]
      : [
          // JwtService,
          UsersRepository,
          ProjectsRepository,
          TasksRepository,
          AuthService,
          UsersService,
          ProjectsService,
          TasksService,
          ConfigService,
          NestConfigService,
        ];

    const exports: any[] = [
      AuthService,
      UsersService,
      ProjectsService,
      TasksService,
      UsersRepository,
      ProjectsRepository,
      TasksRepository,
    ];

    // Only export JwtService if we're providing it directly (mocks mode)
    if (useMocks) {
      exports.push(JwtService);
    }

    return {
      module: TestUtilsModule,
      imports: schemaImports,
      providers,
      exports: exports,
    };
  }
}

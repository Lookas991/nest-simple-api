import { Module } from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";
import { ProjectsModule } from "../projects/projects.module";
import { MongooseModule } from "@nestjs/mongoose";
import { TaskSchema } from "./tasks.schema";
import { TasksRepository } from "./tasks.repository";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Task", schema: TaskSchema }]),
    ProjectsModule,
  ],
  providers: [TasksService, TasksRepository],
  controllers: [TasksController],
})
export class TasksModule {}

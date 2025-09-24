import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProjectsService } from "./projects.service";
import { ProjectsController } from "./projects.controller";
import { ProjectSchema } from "./projects.schema";
import { ProjectsRepository } from "./projects.repository";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Project", schema: ProjectSchema }]),
  ],
  providers: [ProjectsService, ProjectsRepository],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}

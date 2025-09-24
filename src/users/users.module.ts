import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSchema } from "./users.schema";
import { UsersRepository } from "./users.repository";

@Module({
  imports: [MongooseModule.forFeature([{ name: "User", schema: UserSchema }])],
  providers: [UsersService, UsersRepository],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

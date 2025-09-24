import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
import { JwtStrategy } from "./jwt.strategy";
import { ConfigService } from "../config/config.service";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSchema } from "../users/users.schema";
import { UsersService } from "../users/users.service";
import { UsersRepository } from "../users/users.repository";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.jwtSecret,
        signOptions: {
          expiresIn: config.jwtExpiresIn,
        },
      }),
    }),
    MongooseModule.forFeature([{ name: "User", schema: UserSchema }]),
  ],
  providers: [AuthService, JwtStrategy, UsersService, UsersRepository],
  controllers: [AuthController],
})
export class AuthModule {}

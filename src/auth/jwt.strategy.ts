import { Injectable } from "@nestjs/common";
import { Request } from "express";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "../config/config.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    // httpOnly cookie jwt token
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.access_token,
      ]),
      secretOrKey: config.jwtSecret,
    });
    // authorization header jwt token
    // super({
    //   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    //   ignoreExpiration: false,
    //   secretOrKey: config.jwtSecret,
    // });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email };
  }
}

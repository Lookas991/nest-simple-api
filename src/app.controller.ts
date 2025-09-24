import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiTags } from "@nestjs/swagger";
import { ApiAuthEndpoint } from "./common";

@ApiTags("App")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiAuthEndpoint({
    summary: "Hello!",
    responseType: String,
    status: 200,
    auth: false,
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

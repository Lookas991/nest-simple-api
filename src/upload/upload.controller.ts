import { Response } from "express";
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  Get,
  Param,
  Res,
  UseGuards,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadService } from "./upload.service";
import { CurrentUser } from "../auth/user.decorator";
import { ApiTagsWithAuth, UnauthorizedAccessError } from "../common";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UsersService } from "../users/users.service";

ApiTagsWithAuth("Upload");
@UseGuards(JwtAuthGuard)
@Controller("upload")
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly userService: UsersService,
  ) {}

  // Upload avatar
  @Post("avatar")
  @UseInterceptors(FileInterceptor("file"))
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // 5 MB
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          // TODO fix regex
          // new FileTypeValidator({ fileType: /^image\/(jpg|jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    const key = await this.uploadService.uploadFile(file, user.id, "avatar");

    await this.userService.update(user.id, { profile: { avatarId: key } });

    return { key };
  }

  // Upload cover
  @Post("cover")
  @UseInterceptors(FileInterceptor("file"))
  async uploadCover(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          // new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    const key = await this.uploadService.uploadFile(file, user.id, "cover");

    await this.userService.update(user.id, { profile: { coverId: key } });
    return { key };
  }

  // Upload generic attachment
  @Post("attachment")
  @ApiOperation({ summary: "Upload a file to S3" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiResponse({ status: 201, description: "File uploaded successfully" })
  @UseInterceptors(FileInterceptor("file"))
  async uploadAttachment(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          // new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    const key = await this.uploadService.uploadFile(
      file,
      user.id,
      "attachment",
    );
    return { key };
  }

  // Get signed URL for a file
  @Get("url/:key")
  async getSignedUrl(@Param("key") key: string) {
    const url = await this.uploadService.getSignedUrl(key);
    return { url };
  }

  // Download file directly
  @Get("download/:key")
  async downloadFile(
    @Param("key") key: string,
    @Res() res: Response,
    @CurrentUser() user: { id: string },
  ) {
    // Optional security check
    if (
      !key.startsWith(`avatars/${user.id}`) &&
      !key.startsWith(`covers/${user.id}`) &&
      !key.startsWith(`attachments/${user.id}_`)
    ) {
      throw new UnauthorizedAccessError();
    }

    const { stream, contentType, contentLength, contentDisposition } =
      await this.uploadService.getFileStreamWithMeta(key, true);

    res.setHeader("Content-Type", contentType);
    if (contentLength) {
      res.setHeader("Content-Length", contentLength.toString());
    }
    if (contentDisposition) {
      res.setHeader("Content-Disposition", contentDisposition);
    }

    stream.pipe(res);
  }
}

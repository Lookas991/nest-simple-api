import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AppError } from "../errors/app-erros";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger();
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const method = request.method;
    const path = request.url;

    // Error defaults
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Internal server error";
    let errorCode: string | undefined = undefined;
    let validationErrors: any[] | undefined = undefined;

    // NestJS HttpException (e.g. thrown by ValidationPipe)
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === "string") {
        message = res;
      } else if (typeof res === "object" && res !== null) {
        const resObj = res as any;
        message = resObj.message ?? message;
        errorCode = resObj.code;

        // Handle validation error shape (usually an array of strings)
        if (
          Array.isArray(resObj.message) &&
          statusCode === HttpStatus.BAD_REQUEST
        ) {
          validationErrors = resObj.message.map((msg: string) => ({
            message: msg,
          }));
          message = "Validation failed";
        }
      }
    }

    // Custom application errors
    else if (exception instanceof AppError) {
      statusCode = exception.statusCode;
      message = exception.message;
    }

    this.logger.error(`[${request.method}] ${request.url} ->`, exception);

    const errorResponse = {
      error: {
        message,
        statusCode,
        ...(errorCode && { code: errorCode }),
        ...(validationErrors && { validationErrors }),
      },
      meta: {
        timestamp,
        method,
        path,
      },
    };

    response.status(statusCode).json(errorResponse);
  }
}

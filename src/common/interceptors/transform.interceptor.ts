import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, map } from "rxjs";

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((response: any) => {
        const isPaginated =
          Array.isArray(response?.data) && response?.pagination;
        const meta = {
          statusCode: context.switchToHttp().getResponse().statusCode,
          timestamp: new Date().toISOString(),
        };

        if (isPaginated) {
          return {
            data: response.data,
            pagination: response.pagination,
            meta,
          };
        }

        return {
          data: response,
          meta,
        };
      }),
    );
  }
}

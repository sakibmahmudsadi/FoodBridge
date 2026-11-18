import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((result: unknown) => {
        if (result === undefined) {
          return result;
        }

        if (
          result &&
          typeof result === 'object' &&
          'data' in result &&
          'page' in result &&
          'limit' in result &&
          'total' in result
        ) {
          const { data, page, limit, total } = result;
          return { success: true, data, meta: { page, limit, total } };
        }

        return { success: true, data: result };
      }),
    );
  }
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(request: Request, response: Response, next: NextFunction): void {
        console.log(`${request.method} ${request.originalUrl} ${response.statusCode}`)
        next();
    }
}

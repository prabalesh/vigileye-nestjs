import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { VigileEyeService } from './vigileye.service';

@Catch()
export class VigileEyeExceptionFilter implements ExceptionFilter {
    constructor(private readonly vigileyeService: VigileEyeService) { }

    async catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message = exception instanceof Error ? exception.message : 'Internal server error';

        // Log to Vigil Eye
        await this.vigileyeService.logError(exception, {
            url: request.url,
            method: request.method,
            statusCode: status,
            extra: {
                headers: request.headers,
                body: request.body,
                query: request.query,
            },
        });

        // Maintain NestJS default behavior by re-throwing if it's a standard exception
        // or manually sending response if we are at the end of the filter chain
        if (exception instanceof HttpException) {
            return response.status(status).json(exception.getResponse());
        }

        return response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: message,
        });
    }
}

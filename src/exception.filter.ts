import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    Inject,
} from '@nestjs/common';
import { VigileEyeService } from './vigileye.service';
import { VigileEyeOptions } from './interfaces/vigileye-options.interface';

@Catch()
export class VigileEyeExceptionFilter implements ExceptionFilter {
    private readonly ignoreStatusCodes: number[];

    constructor(
        private readonly vigileye: VigileEyeService,
        @Inject('VIGILEYE_OPTIONS') private readonly options: VigileEyeOptions,
    ) {
        // Default: ignore 404 errors
        this.ignoreStatusCodes = options.ignoreStatusCodes ?? [404];
    }

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : 500;

        const message =
            exception instanceof HttpException
                ? exception.message
                : 'Internal server error';

        // Check if this status code should be ignored
        const shouldIgnore = this.ignoreStatusCodes.includes(status);

        // Log to Vigil Eye if:
        // - Status >= 400 (client or server error)
        // - Status not in ignore list
        if (status >= 400 && !shouldIgnore) {
            this.vigileye.logError(exception, {
                url: request.url,
                method: request.method,
                statusCode: status,
                userAgent: request.headers['user-agent'],
                userId: request.user?.id || request.user?.email,
                body: request.body,
                query: request.query,
                params: request.params,
            });
        }

        // Always return response to client (don't break the app)
        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}

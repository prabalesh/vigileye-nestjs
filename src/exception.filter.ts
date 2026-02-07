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
            // Capture and sanitize request data
            const requestBody = this.sanitizeBody(request.body);
            const requestHeaders = this.sanitizeHeaders(request.headers);

            // Measure response time (if available from middleware)
            const responseTime = request['responseTime'] || null;

            // NO await - fire and forget
            this.vigileye.logError(exception, {
                url: request.url,
                method: request.method,
                statusCode: status,
                userAgent: request.headers['user-agent'],
                userId: request.user?.id || request.user?.email,
                body: requestBody,
                query: request.query,
                params: request.params,
                requestBody: JSON.stringify(requestBody),
                requestHeaders: requestHeaders,
                responseTimeMs: responseTime,
            });
        }

        // Return response immediately (not blocked by Vigil Eye)
        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }

    private sanitizeBody(body: any): any {
        if (!body) return null;

        // Remove sensitive fields from request body
        const sanitized = { ...body };
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key'];

        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }

        return sanitized;
    }

    private sanitizeHeaders(headers: any): Record<string, string> {
        const sanitized: Record<string, string> = {};

        const sensitiveHeaders = [
            'authorization',
            'cookie',
            'x-api-key',
            'api-key',
        ];

        for (const [key, value] of Object.entries(headers)) {
            const lowerKey = key.toLowerCase();

            if (sensitiveHeaders.some(sh => lowerKey.includes(sh))) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = String(value);
            }
        }

        return sanitized;
    }
}

import { Injectable, Inject } from '@nestjs/common';
import { VigileEyeOptions, ErrorContext } from './interfaces/vigileye-options.interface';

@Injectable()
export class VigileEyeService {
    private readonly enabled: boolean;
    private readonly apiKey: string;
    private readonly serverUrl: string;
    private readonly timeout: number;

    constructor(@Inject('VIGILEYE_OPTIONS') private options: VigileEyeOptions) {
        this.enabled = options.enabled ?? (process.env.NODE_ENV === 'production');
        this.apiKey = options.apiKey;
        this.serverUrl = options.serverUrl || 'http://localhost:4000';
        this.timeout = options.timeout || 5000;
    }

    /**
     * Log an error to Vigil Eye (non-blocking, fire-and-forget)
     * This method returns immediately without waiting for Vigil Eye response
     */
    logError(error: Error | any, context?: ErrorContext): void {
        if (!this.enabled) {
            if (process.env.NODE_ENV === 'development') {
                console.error('[Vigil Eye] Error (not sent - disabled):', error.message);
            }
            return;
        }

        if (!this.apiKey) {
            console.error('[Vigil Eye] API key not configured');
            return;
        }

        // Fire and forget - don't await
        this.sendErrorAsync(error, context).catch((err) => {
            // Silently fail - never crash the app
            if (process.env.NODE_ENV === 'development') {
                console.error('[Vigil Eye] Failed to send error:', err.message);
            }
        });
    }

    /**
     * Log a warning to Vigil Eye (non-blocking)
     */
    logWarn(message: string, context?: ErrorContext): void {
        if (!this.enabled) return;

        this.sendLogAsync('warn', message, context).catch(() => {
            // Silently fail
        });
    }

    /**
     * Log info message to Vigil Eye (non-blocking)
     */
    logInfo(message: string, context?: Record<string, any>): void {
        if (!this.enabled) return;

        this.sendLogAsync('info', message, context).catch(() => {
            // Silently fail
        });
    }

    /**
     * Internal method - actually sends the error (async)
     */
    private async sendErrorAsync(error: Error | any, context?: ErrorContext): Promise<void> {
        try {
            const payload = {
                source: 'backend',
                level: 'error',
                message: error.message || String(error),
                stack: error.stack || new Error().stack,
                url: context?.url,
                method: context?.method,
                userAgent: context?.userAgent,
                userId: context?.userId,
                statusCode: context?.statusCode,
                requestBody: context?.requestBody,
                requestHeaders: context?.requestHeaders,
                responseBody: context?.responseBody,
                responseTimeMs: context?.responseTimeMs,
                extraData: {
                    ...context?.extra,
                    body: context?.body,
                    query: context?.query,
                    params: context?.params,
                },
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(`${this.serverUrl}/api/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (err) {
            // Re-throw to be caught by caller's .catch()
            throw new Error(`Vigil Eye error: ${err instanceof Error ? err.message : 'Unknown'}`);
        }
    }

    /**
     * Internal method - send log message
     */
    private async sendLogAsync(
        level: string,
        message: string,
        context?: ErrorContext | Record<string, any>,
    ): Promise<void> {
        try {
            const payload = {
                source: 'backend',
                level,
                message,
                url: (context as ErrorContext)?.url,
                method: (context as ErrorContext)?.method,
                userId: (context as ErrorContext)?.userId,
                extraData: context,
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            await fetch(`${this.serverUrl}/api/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
        } catch (err) {
            // Silently ignore
        }
    }
}

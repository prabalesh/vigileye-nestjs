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
     * Log an error to Vigil Eye
     */
    async logError(error: Error | any, context?: ErrorContext): Promise<void> {
        if (!this.enabled) {
            console.error('[Vigil Eye] Error (not sent - disabled):', error.message);
            return;
        }

        if (!this.apiKey) {
            console.error('[Vigil Eye] API key not configured');
            return;
        }

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
                console.error(
                    `[Vigil Eye] Failed to log error: ${response.status} ${response.statusText}`,
                );
            }
        } catch (err) {
            // Don't crash the application if Vigil Eye is down
            console.error('[Vigil Eye] Failed to send error:', err instanceof Error ? err.message : err);
        }
    }

    /**
     * Log a warning to Vigil Eye
     */
    async logWarn(message: string, context?: ErrorContext): Promise<void> {
        if (!this.enabled) return;

        try {
            const payload = {
                source: 'backend',
                level: 'warn',
                message,
                url: context?.url,
                method: context?.method,
                userId: context?.userId,
                extraData: context?.extra,
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
            console.error('[Vigil Eye] Failed to send warning:', err instanceof Error ? err.message : err);
        }
    }

    /**
     * Log info message to Vigil Eye
     */
    async logInfo(message: string, context?: Record<string, any>): Promise<void> {
        if (!this.enabled) return;

        try {
            const payload = {
                source: 'backend',
                level: 'info',
                message,
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
            // Silently fail for info logs
        }
    }
}

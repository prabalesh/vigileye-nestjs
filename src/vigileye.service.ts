import { Injectable, Inject, Optional } from '@nestjs/common';
import axios from 'axios';
import { VigileEyeOptions, ErrorContext } from './interfaces/vigileye-options.interface';

@Injectable()
export class VigileEyeService {
    private readonly enabled: boolean;

    constructor(
        @Inject('VIGILEYE_OPTIONS') private options: VigileEyeOptions,
    ) {
        this.enabled = options.enabled ?? (process.env.NODE_ENV === 'production');
    }

    async logError(error: Error | any, context: ErrorContext = {}) {
        if (!this.enabled) return;

        const payload = {
            source: 'backend',
            level: 'error',
            message: error.message || String(error),
            stack: error.stack,
            url: context.url,
            method: context.method,
            userId: context.userId,
            statusCode: context.statusCode,
            extraData: context.extra,
            timestamp: new Date().toISOString(),
        };

        await this.send(payload);
    }

    async logWarn(message: string, context: any = {}) {
        if (!this.enabled) return;
        await this.send({
            source: 'backend',
            level: 'warn',
            message,
            extraData: context,
            timestamp: new Date().toISOString(),
        });
    }

    async logInfo(message: string, context: any = {}) {
        if (!this.enabled) return;
        await this.send({
            source: 'backend',
            level: 'info',
            message,
            extraData: context,
            timestamp: new Date().toISOString(),
        });
    }

    private async send(payload: any) {
        try {
            const url = `${this.options.serverUrl.replace(/\/$/, '')}/api/log`;
            await axios.post(url, payload, {
                headers: {
                    'X-API-Key': this.options.apiKey,
                    'Content-Type': 'application/json',
                },
                timeout: 5000,
            });
        } catch (err: any) {
            // Catch errors silently as requested to avoid crashing the host app
            console.error('[VigilEye SDK] Failed to send log:', err.message);
        }
    }
}

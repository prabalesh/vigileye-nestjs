export interface VigileEyeOptions {
    /**
     * API key for your Vigil Eye environment
     * Get this from Vigil Eye dashboard > Project > Environments
     */
    apiKey: string;

    /**
     * Vigil Eye server URL
     * @default 'http://localhost:4000'
     */
    serverUrl: string;

    /**
     * Enable/disable error logging
     * Set to false in development to avoid noise
     * @default true in production, false in development
     */
    enabled?: boolean;

    /**
     * HTTP status codes to ignore (won't be logged)
     * Useful for filtering out 404s, 401s, etc.
     * @default [404] - don't log Not Found errors
     * @example [404, 401] - ignore 404 and 401 errors
     * @example [] - log all errors
     */
    ignoreStatusCodes?: number[];

    /**
     * Request timeout in milliseconds
     * @default 5000
     */
    timeout?: number;
}

export interface ErrorContext {
    url?: string;
    method?: string;
    userId?: string;
    statusCode?: number;
    userAgent?: string;
    body?: any;
    query?: any;
    params?: any;
    extra?: Record<string, any>;
}

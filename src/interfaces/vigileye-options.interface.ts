export interface VigileEyeOptions {
    apiKey: string;
    serverUrl: string;
    enabled?: boolean;
}

export interface ErrorContext {
    url?: string;
    method?: string;
    userId?: string;
    statusCode?: number;
    extra?: Record<string, any>;
}

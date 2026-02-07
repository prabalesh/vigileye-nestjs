# Vigil Eye NestJS SDK

A NestJS SDK for [Vigil Eye](https://github.com/prabalesh/vigileye) - the self-hosted error tracking system.

## Installation

```bash
npm install git+https://github.com/prabalesh/vigileye-nestjs.git
```

## Basic Setup

Initialize the `VigileEyeModule` in your `app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { VigileEyeModule } from '@vigileye/nestjs';

@Module({
  imports: [
    VigileEyeModule.forRoot({
      apiKey: 'your-environment-api-key',
      serverUrl: 'http://your-vigileye-server.com',
      enabled: process.env.NODE_ENV === 'production',
      ignoreStatusCodes: [404, 401], // Optional: ignore specific errors
    }),
  ],
})
export class AppModule {}
```

## Multi-Environment Support

Vigil Eye supports multiple environments per project (e.g., Production, Staging, Development). Each environment has its own unique API key. Use environment variables to configure the SDK correctly:

```typescript
VigileEyeModule.forRoot({
  apiKey: process.env.VIGILEYE_API_KEY,
  serverUrl: process.env.VIGILEYE_URL,
  enabled: process.env.NODE_ENV !== 'test',
})
```

## Manual Logging

Inject the `VigileEyeService` to log custom events or handle errors manually:

```typescript
import { Injectable } from '@nestjs/common';
import { VigileEyeService } from '@vigileye/nestjs';

@Injectable()
export class MyService {
  constructor(private readonly vigileye: VigileEyeService) {}

  someMethod() {
    try {
      // ... logic
    } catch (error) {
      this.vigileye.logError(error, {
        userId: 'user-123',
        extra: { someData: 'value' }
      });
    }
  }

  logAudit() {
    this.vigileye.logInfo('Action performed', { category: 'audit' });
  }
}
```

## Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `apiKey` | `string` | **Required** | Your environment-specific API key |
| `serverUrl` | `string` | `http://localhost:4000` | URL of your Vigil Eye server |
| `enabled` | `boolean` | `true` (in prod) | Enable/disable all logging |
| `ignoreStatusCodes` | `number[]` | `[404]` | HTTP status codes to ignore |
| `timeout` | `number` | `5000` | Request timeout in ms |

## Context Interface

When logging errors manually, you can provide an `ErrorContext`:

```typescript
interface ErrorContext {
  url?: string;
  method?: string;
  userId?: string;
  statusCode?: number;
  userAgent?: string;
  body?: any;
  query?: any;
  params?: any;
  requestBody?: string;
  requestHeaders?: Record<string, string>;
  responseTimeMs?: number;
  extra?: Record<string, any>;
}
```

## Data Captured

Vigil Eye automatically captures the following data when an error occurs:

### Error Details
- Error message and stack trace
- Error level (error, warn, info)
- Timestamp

### Request Context
- HTTP method (GET, POST, etc.)
- Request URL
- Request body (sensitive fields redacted)
- Request headers (authorization, cookies redacted)
- Query parameters
- Route parameters
- User agent

### Response Context
- Status code
- Response time in milliseconds

### Sensitive Data Handling
The SDK automatically redacts sensitive information:
- ✅ Passwords → [REDACTED]
- ✅ Authorization headers → [REDACTED]
- ✅ Cookies → [REDACTED]
- ✅ API keys → [REDACTED]
- ✅ Tokens → [REDACTED]

Request and response bodies are limited to prevent large data transmission.

## Performance & Non-Blocking

**This SDK is completely non-blocking (fire-and-forget).** 

### What This Means

✅ **Your API responds immediately** - No waiting for Vigil Eye server
✅ **Never slows down your app** - Logging happens in background
✅ **Graceful failures** - If Vigil Eye is down, your app still works
✅ **No impact on latency** - Error tracking adds 0ms to response time

### How It Works

```typescript
// User makes request
GET /api/users → Your NestJS app

// Error occurs
throw new Error('Database connection failed');

// Exception filter catches error
↓
// Vigil Eye logs error (fire-and-forget, no await)
this.vigileye.logError(error, context);  // Returns immediately
↓
// Response sent to user instantly
← 500 Internal Server Error (0ms delay from Vigil Eye)

// In background (async):
↓
Vigil Eye SDK sends error to server
↓
If successful: Error logged ✅
If failed: Silently ignored (your app unaffected) ✅
```

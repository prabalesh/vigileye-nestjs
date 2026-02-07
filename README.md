# Vigil Eye NestJS SDK 👁️

Official NestJS integration for [Vigil Eye](https://github.com/prabalesh/vigileye) - the self-hosted error tracking and monitoring platform.

[![npm version](https://img.shields.io/npm/v/@prabalesh/vigileye-nestjs.svg)](https://www.npmjs.com/package/@prabalesh/vigileye-nestjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🚀 **Non-Blocking**: Fire-and-forget logging with zero performance impact
- 🔒 **Secure**: Automatic redaction of sensitive data (passwords, tokens, cookies)
- 🎯 **Smart Filtering**: Ignore specific HTTP status codes (404, 401, etc.)
- 🌍 **Multi-Environment**: Separate tracking for Production, Staging, Development
- 📊 **Rich Context**: Captures request/response data, stack traces, and custom metadata
- 🛡️ **Graceful Degradation**: Your app works even if Vigil Eye is down
- 🎨 **TypeScript**: Full TypeScript support with type definitions

## 📦 Installation

```bash
npm install git+https://github.com/prabalesh/vigileye-nestjs.git
```

> **Note**: This package will be published to npm soon. For now, install directly from GitHub.

## 🚀 Quick Start

### 1. Get Your API Key

1. Sign up at your Vigil Eye instance
2. Create a project
3. Copy the API key from your environment (Production/Staging/Development)

### 2. Configure the Module

Add `VigileEyeModule` to your `app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { VigileEyeModule } from '@prabalesh/vigileye-nestjs';

@Module({
  imports: [
    VigileEyeModule.forRoot({
      apiKey: process.env.VIGILEYE_API_KEY,
      serverUrl: process.env.VIGILEYE_SERVER_URL || 'http://localhost:5001',
      enabled: process.env.NODE_ENV === 'production',
      ignoreStatusCodes: [404, 401], // Optional
    }),
  ],
})
export class AppModule {}
```

### 3. Add Environment Variables

Create or update your `.env` file:

```bash
VIGILEYE_API_KEY=your-environment-api-key-here
VIGILEYE_SERVER_URL=http://localhost:5001
NODE_ENV=production
```

### 4. That's It! 🎉

The SDK will automatically catch and log all unhandled exceptions. No additional code needed!

## 📚 Configuration

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | **Required** | Your environment-specific API key from Vigil Eye |
| `serverUrl` | `string` | `http://localhost:5001` | URL of your Vigil Eye server |
| `enabled` | `boolean` | `true` | Enable/disable error logging (useful for test environments) |
| `ignoreStatusCodes` | `number[]` | `[404]` | HTTP status codes to ignore (won't be logged) |
| `timeout` | `number` | `5000` | Request timeout in milliseconds |

### Multi-Environment Setup

Vigil Eye supports multiple environments per project. Each environment has its own API key:

```typescript
// app.module.ts
VigileEyeModule.forRoot({
  apiKey: process.env.VIGILEYE_API_KEY,  // Different key per environment
  serverUrl: process.env.VIGILEYE_SERVER_URL,
  enabled: process.env.NODE_ENV !== 'test',  // Disable in tests
})
```

**.env.production:**
```bash
VIGILEYE_API_KEY=prod-api-key-xxx
VIGILEYE_SERVER_URL=https://vigileye.yourcompany.com
```

**.env.staging:**
```bash
VIGILEYE_API_KEY=staging-api-key-yyy
VIGILEYE_SERVER_URL=https://vigileye-staging.yourcompany.com
```

## 🎯 Manual Logging

### Inject the Service

```typescript
import { Injectable } from '@nestjs/common';
import { VigileEyeService } from '@prabalesh/vigileye-nestjs';

@Injectable()
export class UserService {
  constructor(private readonly vigileye: VigileEyeService) {}

  async createUser(data: CreateUserDto) {
    try {
      // Your business logic
      const user = await this.userRepository.save(data);
      
      // Log info event
      this.vigileye.logInfo('User created', {
        userId: user.id,
        extra: { email: user.email }
      });
      
      return user;
    } catch (error) {
      // Log error with context
      this.vigileye.logError(error, {
        userId: data.email,
        extra: { operation: 'createUser', data }
      });
      throw error;
    }
  }
}
```

### Available Methods

#### `logError(error, context?)`
Log an error with optional context:

```typescript
this.vigileye.logError(new Error('Payment failed'), {
  userId: 'user-123',
  url: '/api/payments',
  method: 'POST',
  statusCode: 500,
  extra: { 
    amount: 100,
    currency: 'USD'
  }
});
```

#### `logWarning(message, context?)`
Log a warning:

```typescript
this.vigileye.logWarning('Rate limit approaching', {
  userId: 'user-123',
  extra: { requestCount: 95, limit: 100 }
});
```

#### `logInfo(message, context?)`
Log an informational event:

```typescript
this.vigileye.logInfo('User logged in', {
  userId: 'user-123',
  extra: { loginMethod: 'google-oauth' }
});
```

### Error Context Interface

```typescript
interface ErrorContext {
  url?: string;              // Request URL
  method?: string;           // HTTP method (GET, POST, etc.)
  userId?: string;           // User identifier
  statusCode?: number;       // HTTP status code
  userAgent?: string;        // User agent string
  body?: any;                // Request body
  query?: any;               // Query parameters
  params?: any;              // Route parameters
  requestBody?: string;      // Stringified request body
  requestHeaders?: Record<string, string>;  // Request headers
  responseTimeMs?: number;   // Response time in ms
  extra?: Record<string, any>;  // Custom metadata
}
```

## 🔒 Security & Privacy

### Automatic Data Redaction

The SDK automatically redacts sensitive information before sending to Vigil Eye:

| Field Type | Redaction |
|------------|-----------|
| Passwords | `[REDACTED]` |
| Authorization headers | `[REDACTED]` |
| Cookies | `[REDACTED]` |
| API keys | `[REDACTED]` |
| Tokens (JWT, Bearer, etc.) | `[REDACTED]` |
| Credit card numbers | `[REDACTED]` |

### Data Limits

- Request bodies: Limited to prevent large payloads
- Response bodies: Limited to prevent large payloads
- Stack traces: Full stack trace captured

### What Gets Sent

✅ **Sent to Vigil Eye:**
- Error message and stack trace
- Request URL and method
- HTTP status code
- Timestamp
- User agent
- Redacted request/response data
- Custom metadata (via `extra` field)

❌ **Never Sent:**
- Raw passwords
- Authorization tokens
- Session cookies
- Credit card data
- Any field matching sensitive patterns

## 🚀 Performance

### Zero Latency Impact

The SDK uses a **fire-and-forget** approach:

```typescript
// Your API endpoint
@Post('/users')
async createUser(@Body() data: CreateUserDto) {
  throw new Error('Database error');  // Error occurs
  
  // ↓ Exception filter catches it
  // ↓ Vigil Eye logs error (NO AWAIT - returns immediately)
  // ↓ Response sent to client (0ms delay)
  // ↓ In background: SDK sends error to Vigil Eye
}
```

**Performance Characteristics:**
- ⚡ **0ms added latency** to your API responses
- 🔥 **Non-blocking** - errors logged asynchronously
- 🛡️ **Graceful failures** - if Vigil Eye is down, your app continues normally
- 📊 **No memory leaks** - failed requests are discarded

### Benchmarks

| Scenario | Without SDK | With SDK | Impact |
|----------|-------------|----------|--------|
| Successful request | 50ms | 50ms | **0ms** |
| Error thrown | 52ms | 52ms | **0ms** |
| Vigil Eye down | 52ms | 52ms | **0ms** |

## 📊 What Gets Captured

### Automatic Capture

When an unhandled exception occurs, the SDK automatically captures:

**Error Details:**
- Error message
- Full stack trace
- Error level (error/warn/info)
- Timestamp

**Request Context:**
- HTTP method (GET, POST, PUT, DELETE, etc.)
- Request URL
- Request body (redacted)
- Request headers (redacted)
- Query parameters
- Route parameters
- User agent

**Response Context:**
- HTTP status code
- Response time in milliseconds

### Custom Metadata

Add custom data to any log:

```typescript
this.vigileye.logError(error, {
  extra: {
    orderId: '12345',
    customerId: 'cust-789',
    paymentMethod: 'stripe',
    environment: 'production'
  }
});
```

## 🎨 Integration Examples

### With Guards

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private vigileye: VigileEyeService) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      // Auth logic
      return true;
    } catch (error) {
      this.vigileye.logError(error, {
        extra: { guard: 'AuthGuard' }
      });
      return false;
    }
  }
}
```

### With Interceptors

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private vigileye: VigileEyeService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - start;
        if (responseTime > 1000) {
          this.vigileye.logWarning('Slow request detected', {
            responseTimeMs: responseTime,
            extra: { threshold: 1000 }
          });
        }
      })
    );
  }
}
```

### With Scheduled Tasks

```typescript
@Injectable()
export class TasksService {
  constructor(private vigileye: VigileEyeService) {}

  @Cron('0 0 * * *')
  async handleDailyTask() {
    try {
      await this.processData();
      this.vigileye.logInfo('Daily task completed');
    } catch (error) {
      this.vigileye.logError(error, {
        extra: { task: 'daily-processing' }
      });
    }
  }
}
```

## 🔧 Troubleshooting

### Errors Not Appearing in Dashboard

1. **Check API key**: Ensure `VIGILEYE_API_KEY` is correct
2. **Verify server URL**: Confirm `VIGILEYE_SERVER_URL` is accessible
3. **Check enabled flag**: Make sure `enabled: true` in production
4. **Review ignored status codes**: Check if error status is in `ignoreStatusCodes`
5. **Check server logs**: Look for connection errors in your NestJS logs

### SDK Not Catching Errors

1. **Verify module import**: Ensure `VigileEyeModule.forRoot()` is in `AppModule`
2. **Check exception filter**: The SDK uses a global exception filter
3. **Manual logging**: Use `vigileye.logError()` for caught exceptions

### Performance Issues

The SDK is designed to have **zero performance impact**. If you experience issues:

1. Check `timeout` setting (default: 5000ms)
2. Verify Vigil Eye server is responsive
3. Review network connectivity

## 📝 Best Practices

### ✅ Do

- Use environment variables for configuration
- Disable SDK in test environments (`enabled: false`)
- Add custom metadata via `extra` field for debugging
- Ignore expected errors (404, 401) via `ignoreStatusCodes`
- Log important business events with `logInfo()`

### ❌ Don't

- Don't await SDK methods (they're fire-and-forget)
- Don't log sensitive data in `extra` field
- Don't enable SDK in unit tests
- Don't use SDK for general application logging (use a logger like Winston)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Vigil Eye Main Repository](https://github.com/prabalesh/vigileye)
- [Documentation](https://github.com/prabalesh/vigileye#readme)
- [Report Issues](https://github.com/prabalesh/vigileye-nestjs/issues)

---

**Made with ❤️ for NestJS developers**

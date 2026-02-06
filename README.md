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
  extra?: Record<string, any>;
}
```

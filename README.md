# Vigil Eye NestJS SDK

A NestJS SDK for [Vigil Eye](https://github.com/vigileye/vigileye) - the self-hosted error tracking system.

## Installation

```bash
npm install @vigileye/nestjs axios
```

## Basic Usage

### 1. Register the Module

Import `VigileEyeModule` into your root `AppModule`:

```typescript
import { Module } from '@nestjs/common';
import { VigileEyeModule } from '@vigileye/nestjs';

@Module({
  imports: [
    VigileEyeModule.forRoot({
      apiKey: process.env.VIGILEYE_API_KEY!,
      serverUrl: process.env.VIGILEYE_URL || 'https://vigileye.yourdomain.com',
      enabled: process.env.NODE_ENV === 'production',
    }),
  ],
})
export class AppModule {}
```

Registering `VigileEyeModule` automatically attaches a global exception filter that logs all unhandled exceptions to your Vigil Eye server.

### 2. Manual Logging

You can inject `VigileEyeService` into any of your services to log errors, warnings, or info messages manually.

```typescript
import { Injectable } from '@nestjs/common';
import { VigileEyeService } from '@vigileye/nestjs';

@Injectable()
export class UserService {
  constructor(private readonly vigileye: VigileEyeService) {}

  async createUser(data: any) {
    try {
      // your business logic
    } catch (error) {
      await this.vigileye.logError(error, {
        userId: data.id,
        extra: { payload: data },
      });
      throw error;
    }
  }
}
```

## Configuration Options

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `apiKey` | `string` | Yes | Your project's Vigil Eye API Key |
| `serverUrl` | `string` | Yes | The URL of your Vigil Eye server |
| `enabled` | `boolean` | No | Defaults to `true` if `NODE_ENV=production`, otherwise `false` |

## License

MIT

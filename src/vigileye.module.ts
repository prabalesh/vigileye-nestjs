import { DynamicModule, Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { VigileEyeOptions } from './interfaces/vigileye-options.interface';
import { VigileEyeService } from './vigileye.service';
import { VigileEyeExceptionFilter } from './exception.filter';

@Global()
@Module({})
export class VigileEyeModule {
    static forRoot(options: VigileEyeOptions): DynamicModule {
        return {
            module: VigileEyeModule,
            providers: [
                {
                    provide: 'VIGILEYE_OPTIONS',
                    useValue: options,
                },
                VigileEyeService,
                {
                    provide: APP_FILTER,
                    useClass: VigileEyeExceptionFilter,
                },
            ],
            exports: [VigileEyeService],
        };
    }
}

import { Global, Module } from '@nestjs/common'
import { appConfig } from './app.config'

export const APP_CONFIG = Symbol('APP_CONFIG')

@Global()
@Module({
  providers: [{ provide: APP_CONFIG, useValue: appConfig }],
  exports: [APP_CONFIG],
})
export class ConfigModule {}

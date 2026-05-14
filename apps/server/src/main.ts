import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { appConfig } from './config/app.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true })
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    })
  )
  await app.listen(appConfig.port)

  console.log(`KB server listening on http://localhost:${appConfig.port}`)
}

bootstrap().catch(error => {
  console.error('Failed to start server', error)
  process.exit(1)
})

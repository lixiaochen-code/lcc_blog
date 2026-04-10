import "reflect-metadata";
import fs from "node:fs";
import path from "node:path";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: false,
    })
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(process.env.AI_DEV_PORT || 3030);
  await app.listen(port);
  const logPath = path.join(process.cwd(), "data", "ai-server.log");
  const line = JSON.stringify({
    time: new Date().toISOString(),
    event: "server_started",
    server: "nestjs",
    port,
    cwd: process.cwd(),
  });
  fs.appendFileSync(logPath, `${line}\n`, "utf8");
  console.log(`AI dev server (NestJS) listening on http://localhost:${port}`);
}

void bootstrap();

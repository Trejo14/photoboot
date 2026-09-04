import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Railway sits in front of the app behind a reverse proxy; without this,
  // every request's IP resolves to the proxy's address, so rate limiting
  // by IP would throttle all clients as one.
  app.getHttpAdapter().getInstance().set("trust proxy", 1);

  const corsOrigin = (
    config.get<string>("CORS_ORIGIN") ?? "http://localhost:3000"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  // La app de escritorio (Tauri) sirve su UI desde un origen interno tipo
  // `tauri://localhost` o `https://tauri.localhost` según plataforma/versión;
  // se acepta cualquier variante en vez de fijar un solo string exacto.
  const isTauriOrigin = (origin: string) =>
    origin.startsWith("tauri://") ||
    /^https?:\/\/tauri\.localhost$/.test(origin);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || corsOrigin.includes(origin) || isTauriOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origen no permitido: ${origin}`), false);
    },
  });

  app.use("/payments/webhook", express.raw({ type: "application/json" }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = config.get<number>("PORT") ?? 4000;
  await app.listen(port);
  console.log(`@photobooth/api listening on http://localhost:${port}`);
}

void bootstrap();

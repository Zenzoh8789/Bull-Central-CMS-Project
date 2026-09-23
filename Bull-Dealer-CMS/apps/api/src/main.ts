import "./environment";
import express from "express";
import { resolve } from "node:path";
import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import rateLimit from "express-rate-limit";
import { AppModule } from "./app.module";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.use(express.json({ limit: "2mb" }));
  app.use((req: any, res: any, next: any) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.path.startsWith("/api/"))
      res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(
    "/uploads",
    express.static(resolve(process.env.MEDIA_DIR || "uploads"), {
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
      },
    }),
  );
  app.use("/api/auth/login", rateLimit({ windowMs: 60000, limit: 10 }));
  if (process.env.NODE_ENV === "production")
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.use(
    "/api/enquiries",
    rateLimit({
      windowMs: 60000,
      limit: 5,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(Number(process.env.PORT || 3000), "0.0.0.0");
}
void bootstrap().catch((error) => {
  console.error("API startup failed:", error.message);
  process.exit(1);
});

import 'dotenv/config'; // Load environment variables from .env
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API prefix — all routes are /api/...
  app.setGlobalPrefix('api');

  // Validation pipe — strips unknown fields, transforms to DTO class instances
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,        // auto-transform payloads to DTO types
    }),
  );

  // CORS — allow the admin portal and local dev
  app.enableCors({
    origin: [
      process.env.ADMIN_URL ?? 'http://localhost:3001',
      'http://localhost:3000',
    ],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
}

bootstrap();

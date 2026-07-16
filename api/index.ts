import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';

const server = express();

let isAppInitialized = false;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  
  // Global API prefix — matches main.ts configuration
  app.setGlobalPrefix('api');
  
  // Validation pipe — matches main.ts configuration
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // CORS configuration — matches main.ts configuration
  app.enableCors({
    origin: [
      process.env.ADMIN_URL ?? 'http://localhost:3001',
      'http://localhost:3000',
    ],
    credentials: true,
  });

  await app.init();
  isAppInitialized = true;
}

export default async (req: any, res: any) => {
  if (!isAppInitialized) {
    await bootstrap();
  }
  server(req, res);
};

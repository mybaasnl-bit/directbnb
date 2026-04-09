// Polyfill Web Crypto API for Node.js < 19 (required by @nestjs/schedule)
if (typeof (globalThis as any).crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  (globalThis as any).crypto = require('crypto').webcrypto;
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    rawBody: true, // Required for Stripe webhook signature verification
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

  // ─── Health check & root redirect ───────────────────────────────────────────
  app.use('/', (req: any, res: any, next: any) => {
    if (req.method === 'GET' && req.path === '/api/v1/health') {
      return res.status(200).json({ status: 'ok' });
    }
    if (req.path === '/' && req.method === 'GET') {
      return res.redirect('/api/docs');
    }
    next();
  });

  // ─── Security ───────────────────────────────────────────────────────────────
  app.use(helmet());

  const landingUrl = configService.get<string>('LANDING_URL', 'http://localhost:3002');
  app.enableCors({
    origin: [frontendUrl, landingUrl, 'https://directbnb.nl', 'https://www.directbnb.nl'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ─── Global prefix ──────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Validation ─────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Global filters & interceptors ──────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ─── Swagger (dev only) ─────────────────────────────────────────────────────
  if (configService.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('DirectBnB API')
      .setDescription('DirectBnB SaaS Platform — REST API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('properties', 'Property management')
      .addTag('rooms', 'Room management')
      .addTag('bookings', 'Booking management')
      .addTag('guests', 'Guest management')
      .addTag('availability', 'Availability & calendar')
      .addTag('feedback', 'Beta feedback')
      .addTag('dashboard', 'Dashboard overview')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  console.log(`DirectBnB API running on http://localhost:${port}/api/v1`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();

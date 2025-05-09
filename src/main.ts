import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const fieldErrors = {};

        errors.forEach((error) => {
          const field = error.property;
          const constraints = error.constraints;

          if (constraints) {
            fieldErrors[field] = Object.values(constraints);
          }
        });

        return new BadRequestException({
          message: 'Validation failed',
          fieldErrors,
        });
      },
    }),
  );

  app.use((req, res, next) => {
    res.header(
      'Access-Control-Allow-Origin',
      'https://oigatech-iraq.vercel.app',
    );
    res.header(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    );
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
    optionsSuccessStatus: 204,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

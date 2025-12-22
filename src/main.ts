import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  await app.listen(process.env.PORT ?? 3000);
  // try {
  //   console.log('Starting NestJS with Neon...'); // Debug entry
  //   const app = await NestFactory.create(AppModule);

  //   await app.listen(3000);
  //   console.log('Server listening on http://localhost:3000'); // Confirms bind
  // } catch (error) {
  //   console.error('Bootstrap failed:', error); // Catches DB/auth crashes
  //   process.exit(1);
  // }
}
bootstrap();

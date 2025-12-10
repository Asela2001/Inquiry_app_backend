import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
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

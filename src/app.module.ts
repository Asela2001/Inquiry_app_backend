import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { InquiriesModule } from './inquiries/inquiries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere
      envFilePath: '.env', // Points to your .env
    }),

    // TypeORM with env vars via ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASS'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Auto-create tables for dev (set false in prod)
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),

    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-key', // Use .env in prod!
      signOptions: { expiresIn: '24h' },
    }),

    AuthModule,

    InquiriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

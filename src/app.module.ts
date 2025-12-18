import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { InquiriesModule } from './inquiries/inquiries.module';
import { CategoriesModule } from './categories/categories.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { RanksModule } from './ranks/ranks.module';
import { EstablishmentsModule } from './establishments/establishments.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AttachmentsModule } from './attachments/attachments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere
      envFilePath: '.env', // Points to your .env
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,  // 60s window
          limit: 5,  // 5 requests/min per IP
        },
      ],
    }),

    // TypeORM with env vars via ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        console.log(
          'Raw DATABASE_URL from .env:',
          dbUrl ? 'Loaded (Neon mode)' : 'Undefined - check .env',
        );
        if (dbUrl) {
          // Neon mode: Use full URI for SSL/channel binding
          console.log('Connecting to Neon database.');
          return {
            type: 'postgres',
            url: dbUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: false, // Use migrations in prod; false prevents schema overwrites
            autoLoadEntities: true,
            ssl: true, // Required for Neon security
            extra: {
              ssl: { rejectUnauthorized: false }, // Handles cert validation if needed
            },
            logging: ['query', 'error'], // Logs joins (e.g., inquiry + requester for call details)
          };
        }
        console.log("Run on localhost postgress DB.");
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: +configService.get('DB_PORT'),
          username: configService.get('DB_USER'),
          password: configService.get('DB_PASS'),
          database: configService.get('DB_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: false, // Auto-create tables for dev (set false in prod)
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),

    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-key', // Use .env in prod!
      signOptions: { expiresIn: '24h' },
    }),

    AuthModule,
    InquiriesModule,
    CategoriesModule,
    UsersModule,
    EmailModule,
    RanksModule,
    EstablishmentsModule,
    AttachmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import databaseConfig, { DatabaseConfig } from './config/database.config';
import { buildMikroOrmOptions } from './config/mikro-orm.config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import AppConfig from './config/app.config';
import { AppController } from './app.controller';
import { HealthModule } from './health/health.module';
import { PostsModule } from './posts/posts.module';
import { ScheduleModule } from '@nestjs/schedule';
import { minutes, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BucketModule } from './bucket/bucket.module';
import bucketConfig from '@/config/bucket.config';
import servicesConfig from '@/config/services.config';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          limit: 100,
          ttl: minutes(1),
          blockDuration: minutes(5),
        },
      ],
      errorMessage: 'Too many requests. Slow down!',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, AppConfig, bucketConfig, servicesConfig],
    }),
    MikroOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildMikroOrmOptions(config.getOrThrow<DatabaseConfig>('database')),
    }),
    UsersModule,
    AuthModule,
    HealthModule,
    PostsModule,
    BucketModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

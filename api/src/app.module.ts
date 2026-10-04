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
import databaseConfig, { DatabaseConfig } from './config/database.config.js';
import { buildMikroOrmOptions } from './config/mikro-orm.config.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import AppConfig from './config/app.config.js';
import { AppController } from './app.controller.js';
import { HealthModule } from './health/health.module.js';
import { PostsModule } from './posts/posts.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { minutes, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BucketModule } from './bucket/bucket.module.js';
import { MailerModule } from './mailer/mailer.module.js';
import { GifModule } from './gif/gif.module.js';
import bucketConfig from '#/config/bucket.config.js';
import servicesConfig from '#/config/services.config.js';
import mailConfig from '#/config/mail.config.js';
import giphyConfig from '#/config/giphy.config.js';

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
      load: [
        databaseConfig,
        AppConfig,
        bucketConfig,
        servicesConfig,
        mailConfig,
        giphyConfig,
      ],
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
    MailerModule,
    GifModule,
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

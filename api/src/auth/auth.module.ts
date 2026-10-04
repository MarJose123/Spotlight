/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createSecretKey } from 'node:crypto';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { TokenService } from './token.service.js';
import { TokenCron } from './cron/token.cron.js';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from '#/users/entities/user.entity.js';
import { RefreshToken } from '#/auth/entities/refresh-token.entity.js';
import { AuthController } from './auth.controller.js';
import { OAuthService } from './oauth.service.js';
import { ZohoStrategy } from './strategies/zoho.strategy.js';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt', property: 'auth' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: createSecretKey(
          Buffer.from(configService.getOrThrow<string>('app.key')),
        ),
        signOptions: { expiresIn: '5m', algorithm: 'HS256' },
      }),
    }),
    MikroOrmModule.forFeature([User, RefreshToken]),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    TokenService,
    TokenCron,
    ZohoStrategy,
    OAuthService,
  ],
  exports: [AuthService, PassportModule, JwtModule],
  controllers: [AuthController],
})
export class AuthModule {}

/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createSecretKey } from 'node:crypto';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';
import { TokenCron } from './cron/token.cron';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from '@/users/entities/user.entity';
import { RefreshToken } from '@/auth/entities/refresh-token.entity';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: createSecretKey(
          Buffer.from(configService.getOrThrow<string>('app.key')),
        ),
        signOptions: { expiresIn: '5m' },
      }),
    }),
    MikroOrmModule.forFeature([User, RefreshToken]),
  ],
  providers: [AuthService, JwtStrategy, TokenService, TokenCron],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}

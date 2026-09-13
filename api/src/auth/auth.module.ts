import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createSecretKey } from 'node:crypto';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';
import { TokenCron } from './cron/token.cron';

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
  ],
  providers: [AuthService, JwtStrategy, TokenService, TokenCron],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}

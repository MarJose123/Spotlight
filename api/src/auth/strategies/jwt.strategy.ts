/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/core';
import { User } from '@/users/entities/user.entity';
import { AuthenticatedUserMapper } from '@/auth/mappers/authenticated-user.mapper';
import { AuthenticatedUserDto } from '@/auth/dto/authenticated-user.dto';
import type { VerifiedPayloadInterface } from '@/auth/interface/payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly em: EntityManager,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('app.key'),
    });
  }

  /**
   * Resolves the verified token's subject against a live user, so deleted users
   * lose access immediately. Whatever this returns becomes `request.user`.
   */
  async validate(
    payload: VerifiedPayloadInterface,
  ): Promise<AuthenticatedUserDto> {
    const user = AuthenticatedUserMapper.toResponse(
      await this.em.findOne(User, { id: payload.sub }),
      payload,
    );
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}

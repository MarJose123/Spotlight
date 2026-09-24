/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@/users/entities/user.entity';
import { PayloadInterface } from '@/auth/interface/payload.interface';
import { createHash, randomBytes } from 'node:crypto';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  createAccessToken(user: User): string {
    const payload: PayloadInterface = {
      email: user.email,
      sub: user.id,
    };
    return this.jwtService.sign(payload);
  }

  createRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

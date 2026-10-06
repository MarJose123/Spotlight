/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Injectable } from '@nestjs/common';
import { UserMapper } from '#/users/mappers/user.mapper.js';
import { JwtTokenResponse } from '#/auth/dto/jwt-token-response.dto.js';
import { JwtTokenDto } from '#/auth/dto/jwt-token.dto.js';

@Injectable()
export class JwtTokenMapper {
  constructor(private readonly userMapper: UserMapper) {}

  async toResponse(token: JwtTokenDto): Promise<JwtTokenResponse> {
    return {
      user: this.userMapper.toResponse(token.user),
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_in: token.expires_in,
      token_type: 'Bearer',
    };
  }
}

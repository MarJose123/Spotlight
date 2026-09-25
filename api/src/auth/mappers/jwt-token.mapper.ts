/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { UserMapper } from '@/users/mappers/user.mapper';
import { JwtTokenResponse } from '@/auth/dto/jwt-token-response.dto';
import { JwtTokenDto } from '@/auth/dto/jwt-token.dto';

export class JwtTokenMapper {
  static toResponse(token: JwtTokenDto): JwtTokenResponse {
    return {
      user: UserMapper.toResponse(token.user),
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_in: token.expires_in,
      token_type: 'Bearer',
    };
  }
}

/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '@/users/dto/user-response.dto';

/**
 * The authenticated principal attached to `request.user`.
 *
 * The access token's claims sit at the top level and the user's profile is
 * nested under `user`, so handlers (and clients) can read the token lifetime
 * without decoding the JWT again.
 */
export class AuthenticatedUserDto {
  @ApiProperty({
    description: "The authenticated user's profile.",
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Token subject: the user id, identical to `user.id`.',
    format: 'uuid',
  })
  sub: string;

  @ApiProperty({
    description: 'Issued-at timestamp, in seconds since the Unix epoch.',
    example: 1735689600,
  })
  iat: number;

  @ApiProperty({
    description: 'Expiry timestamp, in seconds since the Unix epoch.',
    example: 1735689900,
  })
  exp: number;
}

/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '@/users/dto/user-response.dto';

export class JwtTokenResponse {
  @ApiPropertyOptional({
    description: "The authenticated user's profile.",
    type: UserResponseDto,
    nullable: true,
  })
  user: UserResponseDto | null;

  @ApiProperty({
    description: 'Short-lived JWT access token.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Opaque refresh token used to mint a new access token.',
    example: 'b7c1f0a9b7c3f1a5e5e2f6e4f4a9d3e2b6c1f0a9b7c3f1a5e5e2f6e4f4a9d3e2',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'Access token lifetime, in seconds.',
    example: 300,
  })
  expires_in: number;

  @ApiProperty({ description: 'Authorization scheme.', example: 'Bearer' })
  token_type: string;
}

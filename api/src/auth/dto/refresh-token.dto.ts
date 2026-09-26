/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** Body shared by `POST /auth/refresh` and `POST /auth/logout`. */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token previously issued by the login endpoint.',
    example: 'b7c1f0a9b7c3f1a5e5e2f6e4f4a9d3e2b6c1f0a9b7c3f1a5e5e2f6e4f4a9d3e2',
  })
  @IsNotEmpty()
  @IsString()
  refresh_token!: string;
}

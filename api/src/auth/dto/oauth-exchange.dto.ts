/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class OAuthExchangeDto {
  @ApiProperty({
    description:
      'Authorization code the provider returned to the client callback route.',
    maxLength: 2048,
    example: '1000.8f2c1a4b9d0e4f6a8b2c5d7e9f1a3b4c.5e6f7a8b',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  code!: string;

  @ApiProperty({
    description:
      'The PKCE verifier whose `S256` challenge was sent to the authorize URL. Never leaves the client except for this call.',
    maxLength: 128,
    example: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  code_verifier!: string;
}

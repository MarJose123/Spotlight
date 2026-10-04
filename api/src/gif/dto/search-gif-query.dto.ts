/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SearchGifQueryDto {
  @ApiProperty({
    description: 'Search query term for finding GIFs.',
    example: 'celebration',
    minLength: 1,
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'Query term is required.' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  query: string;

  @ApiPropertyOptional({
    description: 'Maximum number of GIFs to return.',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 50,
    type: 'integer',
  })
  @IsOptional()
  @IsString()
  limit?: string;
}

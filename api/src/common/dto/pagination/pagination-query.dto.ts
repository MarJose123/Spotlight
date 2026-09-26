/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number to return (1-based).',
    example: 1,
    default: 1,
    minimum: 1,
    type: 'integer',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of records to return per page.',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
    type: 'integer',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 10;
}

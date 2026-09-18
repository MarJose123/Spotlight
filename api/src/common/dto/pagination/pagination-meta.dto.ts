/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class PaginationMetaDto {
  @ApiProperty({ type: 'number' })
  @IsNumber()
  total!: number;

  @ApiProperty({ type: 'number' })
  @IsNumber()
  itemCount!: number;

  @ApiProperty({ type: 'number' })
  @IsNumber()
  perPage!: number;

  @ApiProperty({ type: 'number' })
  @IsNumber()
  totalPages!: number;

  @ApiProperty({ type: 'number' })
  @IsNumber()
  currentPage!: number;

  @ApiProperty({ type: 'boolean' })
  hasNextPage!: boolean;

  @ApiProperty({ type: 'boolean' })
  hasPreviousPage!: boolean;
}

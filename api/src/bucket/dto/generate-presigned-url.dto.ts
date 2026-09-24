/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class GeneratePresignedUrlDto {
  @ApiProperty({ type: 'string', required: true })
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ type: 'string', required: true })
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({ type: 'string', required: true })
  @IsNotEmpty()
  contentType!: string;

  @ApiProperty({ type: 'number', required: true })
  @IsNotEmpty()
  fileSize!: number;
}

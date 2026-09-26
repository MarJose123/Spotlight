/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class GeneratePresignedUrlDto {
  @ApiProperty({
    description: 'Object key the file will be stored under.',
    example: 'posts/2026/01/photo.png',
  })
  @IsNotEmpty()
  @IsString()
  key!: string;

  @ApiProperty({
    description: 'Original file name, used to build the default key.',
    example: 'photo.png',
  })
  @IsNotEmpty()
  @IsString()
  filename!: string;

  @ApiProperty({
    description: 'MIME type of the file being uploaded.',
    example: 'image/png',
  })
  @IsNotEmpty()
  @IsString()
  contentType!: string;

  @ApiProperty({
    description: 'Size of the file in bytes.',
    example: 204800,
    minimum: 1,
    type: 'integer',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  fileSize!: number;
}

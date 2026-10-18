/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Request body for updating a single application setting. */
export class UpdateSettingDto {
  @ApiProperty({
    description:
      'The new value for the setting (must be a non-negative integer as a string).',
    example: '30',
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}

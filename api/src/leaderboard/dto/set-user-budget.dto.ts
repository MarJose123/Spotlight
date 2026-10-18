/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { IsNumber, Min, ValidateIf, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Request body for setting a user's monthly points budget. */
export class SetUserBudgetDto {
  @ApiProperty({
    description:
      'Custom monthly budget override. Set to null to use the global default.',
    example: 150,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.customBudget !== null)
  @IsNumber()
  @Min(0)
  customBudget: number | null;
}

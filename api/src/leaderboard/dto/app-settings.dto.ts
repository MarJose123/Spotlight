/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';

/** Single application setting entry. */
export class AppSettingsDto {
  @ApiProperty({
    description: 'Setting key, e.g. "leaderboard.monthlyPoints".',
  })
  key!: string;

  @ApiProperty({ description: 'JSON string value.' })
  value!: string;

  @ApiProperty({ description: 'Human-readable description.' })
  description!: string;
}

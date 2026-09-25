/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LikePostDto {
  @ApiProperty({ type: 'string', format: 'uuid', required: true })
  @IsNotEmpty()
  @IsUUID()
  postId: string;

  @ApiProperty({ type: 'string', format: 'uuid', required: true })
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}

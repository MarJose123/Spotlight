/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';

/** A comment as returned by the API, decoupled from the persistence entity. */
export class CommentResponseDto {
  @ApiProperty({ description: 'Comment id.', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Body of the comment.' })
  content: string;

  @ApiProperty({
    description: 'Id of the user who authored the comment.',
    format: 'uuid',
  })
  userId: string;

  @ApiProperty({ description: 'Creation timestamp.', format: 'date-time' })
  createdAt: Date;
}

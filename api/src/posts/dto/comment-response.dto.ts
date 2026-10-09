/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';

/** Minimal author info embedded in a comment response. */
export class CommentAuthorDto {
  @ApiProperty({ description: 'Author id.', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Author display name.' })
  name: string;
}

/** A comment as returned by the API, decoupled from the persistence entity. */
export class CommentResponseDto {
  @ApiProperty({ description: 'Comment id.', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Tiptap JSON content of the comment.' })
  contentJson: string;

  @ApiProperty({
    description: 'Author of the comment.',
    type: () => CommentAuthorDto,
  })
  author: CommentAuthorDto;

  @ApiProperty({ description: 'Creation timestamp.', format: 'date-time' })
  createdAt: Date;
}

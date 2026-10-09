/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Tiptap JSON content of the comment.',
    example:
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Great work!"}]}]}',
  })
  @IsNotEmpty()
  contentJson!: string;
}

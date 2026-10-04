/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';
import { PostResponseDto } from '#/posts/dto/post-response.dto.js';

export class PostLikeResponseDto {
  @ApiProperty({
    description: '`true` when the post was liked, `false` when unliked.',
    example: true,
  })
  like: boolean;

  @ApiProperty({
    description: 'The post with its updated like count.',
    type: PostResponseDto,
  })
  post: PostResponseDto;
}

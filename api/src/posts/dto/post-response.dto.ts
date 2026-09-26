/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentType } from '@/posts/enums/attachment-type.enum';
import { PostType } from '@/posts/enums/post-type.enum';

/** A post as returned by the API, decoupled from the persistence entity. */
export class PostResponseDto {
  @ApiProperty({ description: 'Post id.', format: 'uuid' })
  id: string;

  @ApiProperty({
    description: 'Id of the user who authored the post.',
    format: 'uuid',
  })
  userId: string;

  @ApiProperty({ description: 'Body of the post.' })
  content: string;

  @ApiProperty({
    description: 'Kind of media attached to the post.',
    enum: AttachmentType,
    enumName: 'AttachmentType',
  })
  attachmentType: AttachmentType;

  @ApiProperty({
    description: 'Attached media URLs.',
    type: 'array',
    items: { type: 'string', format: 'uri' },
  })
  attachment: string[];

  @ApiProperty({
    description: 'Whether the post was authored by the system or a user.',
    enum: PostType,
    enumName: 'PostType',
  })
  postType: PostType;

  @ApiPropertyOptional({
    description: 'Ids of the users who liked the post.',
    type: 'array',
    items: { type: 'string', format: 'uuid' },
    example: ['3f1a5e5e-2f6e-4f4a-9d3e-2b6c1f0a9b7c'],
  })
  likedBy: string[] | undefined;

  @ApiProperty({
    description: 'Number of likes the post has received.',
    example: 3,
  })
  likesCount: number;

  @ApiProperty({ description: 'Creation timestamp.', format: 'date-time' })
  createdAt: Date;
}

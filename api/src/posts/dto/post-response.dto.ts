/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentType } from '#/common/enums/attachment-type.enum.js';
import { PostType } from '#/posts/enums/post-type.enum.js';

/** Minimal author info embedded in a post response so the client avoids a second request. */
export class PostAuthorDto {
  @ApiProperty({ description: 'Author id.', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Author display name.' })
  name: string;

  @ApiPropertyOptional({ description: 'Author username, may be absent.' })
  username: string | undefined;

  @ApiPropertyOptional({ description: 'Author avatar URL, may be absent.' })
  avatarUrl: string | undefined;
}

export class AttachmentItemResponseDto {
  @ApiProperty({ description: 'URL of the attached media.', format: 'uri' })
  url: string;

  @ApiProperty({
    description: 'Type of the attached media.',
    enum: AttachmentType,
    enumName: 'AttachmentType',
  })
  type: AttachmentType;
}

/** A post as returned by the API, decoupled from the persistence entity. */
export class PostResponseDto {
  @ApiProperty({ description: 'Post id.', format: 'uuid' })
  id: string;

  @ApiProperty({
    description: 'Author of the post.',
    type: () => PostAuthorDto,
  })
  author: PostAuthorDto;

  @ApiProperty({ description: 'Tiptap JSON content for rich text rendering.' })
  contentJson: string;

  @ApiProperty({
    description: 'Attached media items, each with a URL and type.',
    type: [AttachmentItemResponseDto],
  })
  attachments: AttachmentItemResponseDto[];

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

  @ApiProperty({
    description: 'Number of comments the post has received.',
    example: 0,
  })
  commentsCount: number;

  @ApiProperty({ description: 'Creation timestamp.', format: 'date-time' })
  createdAt: Date;
}

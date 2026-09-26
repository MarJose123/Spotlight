/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';
import { AttachmentType } from '@/posts/enums/attachment-type.enum';
import { PostType } from '@/posts/enums/post-type.enum';

export class CreatePostDto {
  @ApiProperty({
    description: 'Body of the post.',
    example: 'Thanks for the help shipping the release!',
  })
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    description: 'Kind of media attached to the post.',
    enum: AttachmentType,
    enumName: 'AttachmentType',
    example: AttachmentType.IMAGE,
  })
  @IsNotEmpty()
  attachmentType!: AttachmentType;

  @ApiProperty({
    description: 'Attached media URLs (may be an empty list).',
    type: 'array',
    items: { type: 'string', format: 'uri' },
    example: ['https://cdn.example.com/spotlight/photo.png'],
  })
  @ArrayNotEmpty()
  @IsArray()
  @IsString({ each: true })
  attachment!: string[];

  @ApiProperty({
    description: 'Whether the post is authored by the system or a user.',
    enum: PostType,
    enumName: 'PostType',
    default: PostType.USER,
    example: PostType.USER,
  })
  @IsNotEmpty()
  postType: PostType = PostType.USER;

  @ApiProperty({
    description: 'Id of the user authoring the post.',
    format: 'uuid',
  })
  @IsNotEmpty()
  user!: string;
}

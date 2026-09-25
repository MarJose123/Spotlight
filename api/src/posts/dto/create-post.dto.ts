/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Enum } from '@mikro-orm/decorators/legacy';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';
import { AttachmentType } from '@/posts/enums/attachment-type.enum';
import { PostType } from '@/posts/enums/post-type.enum';
import { User } from '@/users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ type: 'string', required: true })
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    type: 'string',
    format: 'enum',
    enum: AttachmentType,
    required: true,
  })
  @Enum({ items: () => AttachmentType })
  @IsNotEmpty()
  attachmentType!: AttachmentType;

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'uri' },
    required: true,
  })
  @ArrayNotEmpty()
  @IsArray()
  @IsString({ each: true })
  attachment!: string[];

  @ApiProperty({
    type: 'string',
    format: 'enum',
    enum: PostType,
    required: true,
  })
  @Enum({ items: () => PostType, default: PostType.USER })
  @IsNotEmpty()
  postType: PostType = PostType.USER;

  @ApiProperty({ type: 'string', format: 'uuid', required: true })
  @IsNotEmpty()
  user!: User;
}

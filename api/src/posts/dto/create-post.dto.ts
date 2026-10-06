/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { AttachmentType } from '#/common/enums/attachment-type.enum.js';

export class CreatePostDto {
  @ApiProperty({
    description: 'Body of the post.',
    example: 'Thanks for the help shipping the release!',
  })
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    description: 'The type of attachment for the post.',
    enum: AttachmentType,
    enumName: 'AttachmentType',
  })
  @IsNotEmpty()
  @IsEnum(AttachmentType)
  attachmentType!: AttachmentType;

  @ApiPropertyOptional({
    description:
      'GIF URL — required when attachmentType is GIF; ignored for images and videos.',
    format: 'uri',
    example: 'https://media.giphy.com/media/abc123/giphy.gif',
  })
  @IsOptional()
  @IsUrl()
  gifUrl?: string;
}

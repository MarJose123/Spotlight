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
  @ApiProperty({
    description: 'Id of the post to like or unlike.',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID()
  postId: string;

  @ApiProperty({
    description: 'Id of the user liking the post.',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}

/**
 * Body accepted by `POST /posts/{id}/like`, where the post id comes from the
 * path rather than the body.
 */
export class LikePostByIdDto {
  @ApiProperty({
    description: 'Id of the user liking the post.',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID()
  user: string;
}

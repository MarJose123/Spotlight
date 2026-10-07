/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Minimal user info for a post liker, returned by GET /posts/:id/likes. */
export class PostLikerDto {
  @ApiProperty({ description: 'User id.', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'User display name.' })
  name: string;

  @ApiPropertyOptional({ description: 'User avatar URL, may be absent.' })
  avatarUrl: string | undefined;
}

/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';

/** Response of `GET /posts/upload/pre-signed-url`. */
export class PresignedUrlResponseDto {
  @ApiProperty({
    description: 'Pre-signed URL to `PUT` the file to.',
    format: 'uri',
  })
  url: string;

  @ApiProperty({
    description: 'Object key the file will be stored under.',
    example: 'posts/2026/01/photo.png',
  })
  path: string;
}

/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';

export class GifUrlDto {
  @ApiProperty({
    description: 'The fixed-height GIF URL from Giphy.',
    example: 'https://media.giphy.com/media/xxx/giphy.gif',
  })
  url: string;

  @ApiProperty({
    description: 'The Giphy media ID.',
    example: 'l0HlBO7eyXzrzjr2A',
  })
  id: string;

  @ApiProperty({
    description: 'A short title for the GIF.',
    example: 'Happy Dance',
  })
  title: string;
}

export class SearchGifResponseDto {
  @ApiProperty({
    description: 'List of matching GIFs.',
    type: [GifUrlDto],
  })
  data: GifUrlDto[];
}

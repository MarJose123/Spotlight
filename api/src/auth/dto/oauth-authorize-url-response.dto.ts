/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';

export class OAuthAuthorizeUrlResponseDto {
  @ApiProperty({
    description:
      'Provider authorization URL. Navigate to it with a full page load; it cannot be fetched because the provider answers with a cross-origin redirect.',
    example:
      'https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=...',
  })
  url: string;
}

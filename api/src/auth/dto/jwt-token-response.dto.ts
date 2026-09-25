/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { UserResponseDto } from '@/users/dto/user-response.dto';

export class JwtTokenResponse {
  user: UserResponseDto | null;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

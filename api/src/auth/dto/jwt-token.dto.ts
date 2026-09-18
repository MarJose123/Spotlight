/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { User } from '@/users/entities/user.entity';

export class JwtTokenDto {
  user: any;
  access_token!: string;
  refresh_token!: string;
  expires_in: number;
  token_type: string = 'Bearer';

  constructor(
    user: User,
    access_token: string,
    refresh_token: string,
    expires_in: number = 300,
  ) {
    this.user = user;
    this.access_token = access_token;
    this.refresh_token = refresh_token;
    this.expires_in = expires_in;
  }
}

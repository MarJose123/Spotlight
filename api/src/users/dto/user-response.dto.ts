/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  username: string | undefined;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

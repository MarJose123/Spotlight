/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { User } from '@/users/entities/user.entity';
import { UserResponseDto } from '@/users/dto/user-response.dto';

type UserResponseSource = Pick<
  User,
  'id' | 'email' | 'name' | 'username' | 'createdAt' | 'updatedAt'
>;

export class UserMapper {
  static toResponse(
    user: UserResponseSource | undefined,
  ): UserResponseDto | null {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      displayName: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

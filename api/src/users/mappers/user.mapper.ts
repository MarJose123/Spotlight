/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Injectable } from '@nestjs/common';
import { User } from '#/users/entities/user.entity.js';
import { UserResponseDto } from '#/users/dto/user-response.dto.js';

type UserResponseSource = Pick<
  User,
  | 'id'
  | 'email'
  | 'name'
  | 'username'
  | 'createdAt'
  | 'updatedAt'
  | 'status'
  | 'type'
  | 'avatar'
>;

@Injectable()
export class UserMapper {
  toResponse(user: UserResponseSource | undefined): UserResponseDto | null {
    if (!user) {
      return null;
    }

    const avatarUrl = user.avatar
      ? `/api/v1/posts/attachment/${encodeURIComponent(user.avatar)}`
      : undefined;

    return {
      id: user.id,
      avatarUrl,
      email: user.email,
      name: user.name,
      username: user.username,
      displayName: user.name,
      status: user.status,
      role: user.type,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

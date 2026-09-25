/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { UserMapper } from '@/users/mappers/user.mapper';
import { AuthenticatedUserDto } from '@/auth/dto/authenticated-user.dto';
import type { User } from '@/users/entities/user.entity';
import type { VerifiedPayloadInterface } from '@/auth/interface/payload.interface';

export class AuthenticatedUserMapper {
  /**
   * Nests a user's profile under `user`, alongside the verified access token's
   * claims. Returns null when the user no longer exists.
   */
  static toResponse(
    user: User | null,
    payload: VerifiedPayloadInterface,
  ): AuthenticatedUserDto | null {
    const profile = UserMapper.toResponse(user ?? undefined);
    if (!profile) {
      return null;
    }

    return {
      sub: payload.sub,
      iat: payload.iat,
      exp: payload.exp,
      user: {
        // `UserMapper.toResponse` builds a plain object literal, so no prototype
        // is actually lost here; the rule only sees the declared class type.
        // eslint-disable-next-line typescript/no-misused-spread
        ...profile,
      },
    };
  }
}

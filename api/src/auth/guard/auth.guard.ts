/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Authenticates a request with the `jwt` Passport strategy. The inherited
 * `canActivate` runs `JwtStrategy.validate` and assigns its return value to
 * `request.user`, so no custom token handling is needed here.
 */
@Injectable()
export class Auth extends AuthGuard('jwt') {}

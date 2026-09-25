/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { FastifyRequest } from 'fastify';
import { AuthenticatedUserDto } from '@/auth/dto/authenticated-user.dto';

export interface PayloadInterface {
  email: string;
  sub: string;
}

/**
 * The payload produced by `JwtService.verifyAsync`: the claims we sign, plus the
 * `iat`/`exp` that `jsonwebtoken` adds from `signOptions.expiresIn`.
 */
export interface VerifiedPayloadInterface extends PayloadInterface {
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends FastifyRequest {
  /** The authenticated profile and token claims, attached by the `Auth` guard. */
  user: AuthenticatedUserDto | null;
}

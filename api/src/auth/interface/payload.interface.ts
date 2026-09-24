/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { FastifyRequest } from 'fastify';

export interface PayloadInterface {
  email: string;
  sub: string;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: object | undefined; // or your JWT payload type
}

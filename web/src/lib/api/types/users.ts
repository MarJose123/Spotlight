/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

export interface ApiUser {
	id: string;
	avatarUrl?: string;
	email: string;
	name: string;
	username?: string;
	displayName: string;
	status: string;
	role: string;
	createdAt: string;
	updatedAt: string;
}

export interface ApiAuthenticatedUser {
	user: ApiUser;
	sub: string;
	iat: number;
	exp: number;
}

/** Profile stats for the current user: post count and accumulated likes. */
export interface UserProfileStats {
	postsCount: number;
	likesCount: number;
}

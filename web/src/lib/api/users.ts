/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { requestJsonAuth } from "./client";
import { fetchLeaderboard } from "./leaderboard";
import { fetchUserPostsCount } from "./posts";

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

export async function fetchCurrentUser(): Promise<ApiAuthenticatedUser> {
	return requestJsonAuth<ApiAuthenticatedUser>("/users/me", {
		headers: { accept: "application/json" },
	});
}

/** Profile stats for the current user: post count and accumulated likes. */
export interface UserProfileStats {
	postsCount: number;
	likesCount: number;
}

export async function fetchUserProfileStats(
	userId: string,
): Promise<UserProfileStats> {
	const [postsCount, leaderboard] = await Promise.all([
		fetchUserPostsCount(userId),
		fetchLeaderboard(),
	]);
	const likesCount =
		leaderboard.find((entry) => entry.user.id === userId)?.likesCount ?? 0;
	return { postsCount, likesCount };
}

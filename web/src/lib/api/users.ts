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
import type { ApiAuthenticatedUser, UserProfileStats } from "./types/users";

export type {
	ApiAuthenticatedUser,
	ApiUser,
	UserProfileStats,
} from "./types/users";

export async function fetchCurrentUser(): Promise<ApiAuthenticatedUser> {
	return requestJsonAuth<ApiAuthenticatedUser>("/users/me", {
		headers: { accept: "application/json" },
	});
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

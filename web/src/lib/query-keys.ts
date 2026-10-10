/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
/**
 * TanStack Query key factories.
 *
 * Each function returns a typed array suitable for use as `queryKey`.
 * Using functions instead of static arrays allows parameterized keys
 * (e.g., by post ID) while keeping the root segments explicit.
 */

export function posts() {
	return ["posts"] as const;
}

export function currentUser() {
	return ["currentUser"] as const;
}

export function comments(postId: string) {
	return ["comments", postId] as const;
}

export function postLikes(postId: string) {
	return ["postLikes", postId] as const;
}

export function leaderboard() {
	return ["leaderboard"] as const;
}

export function profileStats(userId: string) {
	return ["profileStats", userId] as const;
}

export function profileStatsAll() {
	return ["profileStats"] as const;
}

export function gifsTrending() {
	return ["gifs", "trending"] as const;
}

export function gifsSearch(query: string) {
	return ["gifs", "search", query] as const;
}

export function users() {
	return ["users"] as const;
}

export function usersDirectory(role?: string, search?: string) {
	return ["usersDirectory", role, search] as const;
}

export function userPosts(userId: string) {
	return ["userPosts", userId] as const;
}

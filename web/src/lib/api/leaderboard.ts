/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { requestJsonAuth } from "./client";

/** A user embedded in a leaderboard entry, matching UserResponseDto from the API. */
export interface ApiLeaderboardUser {
	id: string;
	avatarUrl?: string;
	email: string;
	name: string;
	username: string | undefined;
	displayName: string;
	status: string;
	role: string;
	createdAt: string;
	updatedAt: string;
}

/** One ranked row from the monthly leaderboard. */
export interface ApiLeaderboardEntry {
	rank: number;
	user: ApiLeaderboardUser;
	likesCount: number;
}

export async function fetchLeaderboard(): Promise<ApiLeaderboardEntry[]> {
	return requestJsonAuth<ApiLeaderboardEntry[]>("/leaderboard", {
		headers: { accept: "application/json" },
	});
}

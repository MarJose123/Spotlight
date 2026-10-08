/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { requestJsonAuth } from "./client";
import type { ApiLeaderboardEntry } from "./types/leaderboard";

export type {
	ApiLeaderboardEntry,
	ApiLeaderboardUser,
} from "./types/leaderboard";

export async function fetchLeaderboard(): Promise<ApiLeaderboardEntry[]> {
	return requestJsonAuth<ApiLeaderboardEntry[]>("/leaderboard", {
		headers: { accept: "application/json" },
	});
}

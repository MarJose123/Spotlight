/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { requestJsonAuth } from "./client";
import type {
	AppSetting,
	PaginatedResponse,
	UserBudget,
} from "./types/app-settings";

export type {
	AppSetting,
	PaginatedResponse,
	PaginationMeta,
	UserBudget,
} from "./types/app-settings";

/** Fetch all application settings (admin only). */
export async function fetchSettings(): Promise<AppSetting[]> {
	return requestJsonAuth<AppSetting[]>("/leaderboard/settings", {
		headers: { accept: "application/json" },
	});
}

/** Update a single setting by key (admin only). */
export async function updateSetting(
	key: string,
	value: string,
): Promise<AppSetting> {
	return requestJsonAuth<AppSetting>(`/leaderboard/settings/${key}`, {
		method: "PUT",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ value }),
	});
}

/** Fetch paginated users with their resolved budgets (admin only). */
export async function fetchUsersWithBudgets(
	page: number = 1,
	limit: number = 20,
): Promise<PaginatedResponse<UserBudget>> {
	return requestJsonAuth<PaginatedResponse<UserBudget>>(
		`/leaderboard/settings/users?page=${page}&limit=${limit}`,
		{
			headers: { accept: "application/json" },
		},
	);
}

/** Set or clear a per-user budget override (admin only). */
export async function updateUserBudget(
	userId: string,
	customBudget: number | null,
): Promise<UserBudget> {
	return requestJsonAuth<UserBudget>(
		`/leaderboard/settings/users/${userId}/budget`,
		{
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ customBudget }),
		},
	);
}

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
import type {
	ApiAuthenticatedUser,
	ApiUser,
	UserProfileStats,
} from "./types/users";

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

export interface PaginationMeta {
	total: number;
	itemCount: number;
	perPage: number;
	totalPages: number;
	currentPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

/** Fetch a page of users for the mention dropdown. */
export async function fetchUsers(
	page = 1,
	limit = 100,
): Promise<{ data: ApiUser[]; meta: PaginationMeta }> {
	return requestJsonAuth<{ data: ApiUser[]; meta: PaginationMeta }>(
		`/users?page=${page}&limit=${limit}`,
		{},
	);
}

export interface InviteUserRequest {
	name: string;
	email: string;
}

/** Invite a new user by creating an account via the admin endpoint. */
export async function inviteUser(
	request: InviteUserRequest,
): Promise<ApiUser | null> {
	return requestJsonAuth<ApiUser | null>("/users", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(request),
	});
}

export interface UpdateUserRoleRequest {
	role: string;
}

/** Update a user's role (admin only). */
export async function updateUserRole(
	userId: string,
	request: UpdateUserRoleRequest,
): Promise<ApiUser | null> {
	return requestJsonAuth<ApiUser | null>(`/users/${userId}/role`, {
		method: "PATCH",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(request),
	});
}

/** Activate a user (admin only). */
export async function activateUser(userId: string): Promise<ApiUser | null> {
	return requestJsonAuth<ApiUser | null>(`/users/${userId}/activate`, {
		method: "PATCH",
	});
}

/** Deactivate a user (admin only). */
export async function deactivateUser(userId: string): Promise<ApiUser | null> {
	return requestJsonAuth<ApiUser | null>(`/users/${userId}/deactivate`, {
		method: "PATCH",
	});
}

/** Delete a user permanently (admin only). */
export async function deleteUser(userId: string): Promise<void> {
	return requestJsonAuth<void>(`/users/${userId}`, {
		method: "DELETE",
	});
}

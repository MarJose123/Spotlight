/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

/** A single application setting from the API. */
export interface AppSetting {
	key: string;
	value: string;
	description: string;
}

/** A user with their resolved monthly budget. */
export interface UserBudget {
	user: {
		id: string;
		name: string;
		email: string;
		role: string;
	};
	customBudget: number | null;
	resolvedBudget: number;
}

/** Pagination metadata from the API. */
export interface PaginationMeta {
	total: number;
	itemCount: number;
	perPage: number;
	totalPages: number;
	currentPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

/** Paginated response wrapper. */
export interface PaginatedResponse<T> {
	data: T[];
	meta: PaginationMeta;
}

/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { createFileRoute } from "@tanstack/react-router";
import { UserDirectory } from "#/components/UserDirectory";

export type UsersSearch = {
	search?: string;
};

export const Route = createFileRoute("/_authenticated/users")({
	head: () => ({
		meta: [{ title: "All Users · Spotlight" }],
	}),
	validateSearch: (search: Record<string, unknown>): UsersSearch => ({
		search: typeof search.search === "string" ? search.search : undefined,
	}),
	component: UserDirectory,
});

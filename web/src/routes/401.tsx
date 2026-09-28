/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { createFileRoute } from "@tanstack/react-router";
import UnauthorizedPage from "../components/status/UnauthorizedPage";

type UnauthorizedSearch = {
	redirect?: string;
};

export const Route = createFileRoute("/401")({
	validateSearch: (search: Record<string, unknown>): UnauthorizedSearch => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
	head: () => ({
		meta: [{ title: "Sign in required · Spotlight" }],
	}),
	component: UnauthorizedRoute,
});

function UnauthorizedRoute() {
	const { redirect } = Route.useSearch();

	return <UnauthorizedPage redirectTo={redirect} />;
}

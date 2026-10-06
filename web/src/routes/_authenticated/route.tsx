/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { refreshAccessToken } from "#/lib/api";
import { throwUnauthorized } from "#/lib/auth-guard";
import { isExpired, readSession } from "#/lib/session";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async () => {
		const session = readSession();
		if (!session) {
			throwUnauthorized();
		}

		// Auto-refresh if the access token has expired but the refresh token is valid.
		if (isExpired(session)) {
			try {
				await refreshAccessToken();
			} catch {
				throwUnauthorized();
			}
		}
	},
	component: () => <Outlet />,
});

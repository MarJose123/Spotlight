/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import LoadingScreen from "./components/LoadingScreen";
import {
	StatusErrorBoundary,
	StatusNotFound,
} from "./components/status/boundaries";
import { getContext } from "./integrations/tanstack-query/root-provider";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const context = getContext();

	const router = createTanStackRouter({
		routeTree,
		context,
		// TanStack Router resolves these per route and does not inherit them from
		// the root route, so register the status pages at the router level too.
		defaultErrorComponent: StatusErrorBoundary,
		defaultNotFoundComponent: StatusNotFound,
		// Rendered wherever the router has no match to show yet: it is the SPA
		// shell's only content before hydration, and it covers slow navigations.
		defaultPendingComponent: LoadingScreen,
		defaultPendingMs: 0,
		defaultPendingMinMs: 700,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
	});

	setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient });

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}

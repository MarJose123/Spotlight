/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { redirect } from "@tanstack/react-router";

/**
 * Sends a visitor without a session to the 401 page, remembering where they
 * were headed so they can be returned there after signing in.
 *
 * Call it from `beforeLoad` on any route that requires a session:
 *
 * ```ts
 * beforeLoad: ({ context, location }) => {
 *   if (!context.session) throwUnauthorized(location.href)
 * }
 * ```
 *
 * Throw it rather than returning it: the router treats the thrown redirect as
 * control flow, answers the server request with a 307 to `/401`, and performs a
 * client-side navigation after hydration.
 */
export function throwUnauthorized(redirectTo?: string): never {
	throw redirect({
		to: "/401",
		search: { redirect: redirectTo },
	});
}

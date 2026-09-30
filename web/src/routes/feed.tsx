/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { createFileRoute } from "@tanstack/react-router";
import { Feed } from "../components/feed/Feed";

export const Route = createFileRoute("/feed")({
	head: () => ({
		meta: [{ title: "Feed · Spotlight" }],
	}),
	component: Feed,
});

/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { createFileRoute } from "@tanstack/react-router";
import { AppSettingsPage } from "#/components/AppSettingsPage";

export const Route = createFileRoute("/_authenticated/app-settings")({
	head: () => ({
		meta: [{ title: "Application Settings · Spotlight" }],
	}),
	component: AppSettingsPage,
});

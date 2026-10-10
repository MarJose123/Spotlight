/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: { tsconfigPaths: true },
	test: {
		environment: "jsdom",
		setupFiles: [import.meta.dirname + "/src/test/setup.ts"],
		include: [
			"src/**/__tests__/**/*.spec.ts",
			"src/**/__tests__/**/*.spec.tsx",
		],
	},
});

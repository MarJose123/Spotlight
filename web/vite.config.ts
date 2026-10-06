/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import rootPkg from "./package.json" with { type: "json" };

const apiOrigin = process.env.API_INTERNAL_URL ?? "http://localhost:3000";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	define: {
		"import.meta.env.APP_VERSION": JSON.stringify(rootPkg.version || "0.0.0"),
	},
	plugins: [
		devtools(),
		tailwindcss(),
		tanstackStart({
			spa: {
				enabled: true,
			},
		}),
		viteReact(),
	],
	server: {
		host: true,
		proxy: {
			"/api": {
				target: apiOrigin,
				changeOrigin: true,
			},
		},
	},
});

export default config;

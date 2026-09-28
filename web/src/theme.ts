/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import type { MantineColorsTuple } from "@mantine/core";
import { createTheme, localStorageColorSchemeManager } from "@mantine/core";

/** Spotlight's lagoon palette, taken from the CSS variables in `styles.css`. */
const lagoon: MantineColorsTuple = [
	"#e6f7f5",
	"#d3efec",
	"#a6e0da",
	"#79d1c8",
	"#4fb8b2",
	"#39a7a1",
	"#328f97",
	"#2a767d",
	"#236065",
	"#1a4a4f",
];

export const theme = createTheme({
	primaryColor: "lagoon",
	// Shade 6 (`--lagoon-deep`) is too dim on dark, so dark mode uses shade 4.
	primaryShade: { light: 6, dark: 4 },
	colors: { lagoon },
	defaultRadius: "md",
	fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif",
	headings: {
		fontFamily: "Fraunces, Georgia, serif",
		fontWeight: "700",
	},
});

/** Shares the `theme` key the site already writes, so Mantine follows the header toggle. */
export const colorSchemeManager = localStorageColorSchemeManager({
	key: "theme",
});

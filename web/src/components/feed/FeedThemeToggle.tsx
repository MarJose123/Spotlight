/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeMode } from "../../lib/theme-mode";
import { TopBarAction } from "./TopBarAction";

const MODE_ICON = {
	auto: Monitor,
	dark: Moon,
	light: Sun,
} as const;

/**
 * Signed-in top bar toggle. Shares behaviour with the guest `ThemeToggle` but
 * borrows `TopBarAction` so it lines up with the Explore/Feed/Notifications row.
 */
export function FeedThemeToggle() {
	const { mode, toggleMode, label } = useThemeMode();
	const Icon = MODE_ICON[mode];

	return (
		<TopBarAction label={label} onClick={toggleMode}>
			<Icon size={15} aria-hidden="true" />
		</TopBarAction>
	);
}

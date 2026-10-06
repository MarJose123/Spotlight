/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeMode } from "../lib/theme-mode";

const MODE_ICON = {
	auto: Monitor,
	dark: Moon,
	light: Sun,
} as const;

/**
 * Guest-facing toggle, styled for the site header. The signed-in top bar
 * has its own `AuthThemeToggle` so it can match the `TopBarAction` shell.
 */
export default function ThemeToggle() {
	const { mode, toggleMode, label } = useThemeMode();
	const Icon = MODE_ICON[mode];

	return (
		<button
			type="button"
			onClick={toggleMode}
			aria-label={label}
			title={label}
			className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5"
		>
			<Icon className="h-4 w-4" aria-hidden={true} />
		</button>
	);
}

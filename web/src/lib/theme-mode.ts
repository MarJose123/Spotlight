/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { useMantineColorScheme } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "auto";

/** The key Mantine's color scheme manager and the inline boot script both read. */
const STORAGE_KEY = "theme";

/** Broadcast so several mounted toggles never disagree about the current mode. */
const SYNC_EVENT = "spotlight:theme-change";

const THEME_MODES: readonly ThemeMode[] = ["light", "dark", "auto"];

function isThemeMode(value: string | null | undefined): value is ThemeMode {
	return value != null && (THEME_MODES as readonly string[]).includes(value);
}

/** Persisted mode, defaulting to `auto` on the server and for first-time visitors. */
export function getStoredThemeMode(): ThemeMode {
	if (typeof window === "undefined") {
		return "auto";
	}

	const stored = window.localStorage.getItem(STORAGE_KEY);
	return isThemeMode(stored) ? stored : "auto";
}

/**
 * Writes a mode onto `<html>`: the class Tailwind reads, the
 * `data-mantine-color-scheme` attribute Mantine reads, and the native `color-scheme`.
 */
export function applyThemeMode(mode: ThemeMode) {
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const resolved = mode === "auto" ? (prefersDark ? "dark" : "light") : mode;
	const root = document.documentElement;

	root.classList.remove("light", "dark");
	root.classList.add(resolved);

	// Mantine reads its scheme from this attribute, not the class, so both move.
	root.setAttribute("data-mantine-color-scheme", resolved);

	if (mode === "auto") {
		root.removeAttribute("data-theme");
	} else {
		root.setAttribute("data-theme", mode);
	}

	root.style.colorScheme = resolved;
}

/** Cycles light → dark → auto → light, the order the header toggle has always used. */
export function nextThemeMode(mode: ThemeMode): ThemeMode {
	return mode === "light" ? "dark" : mode === "dark" ? "auto" : "light";
}

/** Label naming the active mode and the one a click moves to. */
export function themeModeLabel(mode: ThemeMode): string {
	const current = mode === "auto" ? "auto (system)" : mode;
	return `Theme mode: ${current}. Click to switch to ${nextThemeMode(mode)} mode.`;
}

export interface ThemeModeController {
	mode: ThemeMode;
	toggleMode: () => void;
	label: string;
}

/**
 * Shared behaviour behind every theme toggle. `mode` intentionally starts at `auto`
 * and settles in an effect so the server HTML and the first client render agree;
 * the inline script in `__root.tsx` has already painted the right colors by then.
 */
export function useThemeMode(): ThemeModeController {
	const [mode, setMode] = useState<ThemeMode>("auto");
	const { setColorScheme } = useMantineColorScheme();

	useEffect(() => {
		const initialMode = getStoredThemeMode();
		setMode(initialMode);
		applyThemeMode(initialMode);
	}, []);

	useEffect(() => {
		if (mode !== "auto") {
			return;
		}

		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => applyThemeMode("auto");

		media.addEventListener("change", onChange);
		return () => {
			media.removeEventListener("change", onChange);
		};
	}, [mode]);

	// Keeps every mounted toggle in step, and follows changes made in other tabs.
	useEffect(() => {
		const onSync = (event: Event) => {
			const detail = (event as CustomEvent<ThemeMode>).detail;
			if (isThemeMode(detail)) {
				setMode(detail);
			}
		};

		const onStorage = () => {
			const stored = getStoredThemeMode();
			setMode(stored);
			applyThemeMode(stored);
		};

		window.addEventListener(SYNC_EVENT, onSync);
		window.addEventListener("storage", onStorage);
		return () => {
			window.removeEventListener(SYNC_EVENT, onSync);
			window.removeEventListener("storage", onStorage);
		};
	}, []);

	const toggleMode = useCallback(() => {
		const nextMode = nextThemeMode(mode);
		setMode(nextMode);
		applyThemeMode(nextMode);
		// Keep Mantine's in-memory scheme in step with the `theme` key below.
		setColorScheme(nextMode);
		window.localStorage.setItem(STORAGE_KEY, nextMode);
		window.dispatchEvent(
			new CustomEvent<ThemeMode>(SYNC_EVENT, { detail: nextMode }),
		);
	}, [mode, setColorScheme]);

	return { mode, toggleMode, label: themeModeLabel(mode) };
}

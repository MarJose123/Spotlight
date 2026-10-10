/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	applyThemeMode,
	getStoredThemeMode,
	nextThemeMode,
	themeModeLabel,
} from "#/lib/theme-mode.js";

const STORAGE_KEY = "theme";

beforeEach(() => {
	localStorage.clear();
	document.documentElement.classList.remove("light", "dark");
	document.documentElement.removeAttribute("data-mantine-color-scheme");
	document.documentElement.removeAttribute("data-theme");
	document.documentElement.style.colorScheme = "";
});

afterEach(() => {
	localStorage.clear();
	document.documentElement.classList.remove("light", "dark");
	document.documentElement.removeAttribute("data-mantine-color-scheme");
	document.documentElement.removeAttribute("data-theme");
	document.documentElement.style.colorScheme = "";
});

describe("getStoredThemeMode", () => {
	it("returns 'light' when stored", () => {
		localStorage.setItem(STORAGE_KEY, "light");
		expect(getStoredThemeMode()).toBe("light");
	});

	it("returns 'dark' when stored", () => {
		localStorage.setItem(STORAGE_KEY, "dark");
		expect(getStoredThemeMode()).toBe("dark");
	});

	it("returns 'auto' when nothing is stored", () => {
		expect(getStoredThemeMode()).toBe("auto");
	});

	it("returns 'auto' for invalid stored value", () => {
		localStorage.setItem(STORAGE_KEY, "invalid");
		expect(getStoredThemeMode()).toBe("auto");
	});

	it("returns 'auto' for empty string", () => {
		localStorage.setItem(STORAGE_KEY, "");
		expect(getStoredThemeMode()).toBe("auto");
	});
});

describe("nextThemeMode", () => {
	it("cycles light to dark", () => {
		expect(nextThemeMode("light")).toBe("dark");
	});

	it("cycles dark to auto", () => {
		expect(nextThemeMode("dark")).toBe("auto");
	});

	it("cycles auto to light", () => {
		expect(nextThemeMode("auto")).toBe("light");
	});

	it("completes a full cycle", () => {
		expect(nextThemeMode(nextThemeMode(nextThemeMode("light")))).toBe("light");
	});
});

describe("themeModeLabel", () => {
	it("returns label for light mode", () => {
		expect(themeModeLabel("light")).toBe(
			"Theme mode: light. Click to switch to dark mode.",
		);
	});

	it("returns label for dark mode", () => {
		expect(themeModeLabel("dark")).toBe(
			"Theme mode: dark. Click to switch to auto mode.",
		);
	});

	it("returns label for auto mode with system note", () => {
		expect(themeModeLabel("auto")).toBe(
			"Theme mode: auto (system). Click to switch to light mode.",
		);
	});
});

describe("applyThemeMode", () => {
	it("applies light mode directly", () => {
		applyThemeMode("light");

		expect(document.documentElement.classList.contains("light")).toBe(true);
		expect(document.documentElement.classList.contains("dark")).toBe(false);
		expect(
			document.documentElement.getAttribute("data-mantine-color-scheme"),
		).toBe("light");
		expect(document.documentElement.getAttribute("data-theme")).toBe("light");
		expect(document.documentElement.style.colorScheme).toBe("light");
	});

	it("applies dark mode directly", () => {
		applyThemeMode("dark");

		expect(document.documentElement.classList.contains("dark")).toBe(true);
		expect(document.documentElement.classList.contains("light")).toBe(false);
		expect(
			document.documentElement.getAttribute("data-mantine-color-scheme"),
		).toBe("dark");
		expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
		expect(document.documentElement.style.colorScheme).toBe("dark");
	});

	it("sets data-theme to the mode value for non-auto modes", () => {
		applyThemeMode("light");
		expect(document.documentElement.getAttribute("data-theme")).toBe("light");

		applyThemeMode("dark");
		expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
	});

	it("removes data-theme for auto mode", () => {
		// Mock prefers-color-scheme to dark
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: (query: string) => ({
				matches: query.includes("dark"),
				addEventListener: () => {},
				removeEventListener: () => {},
			}),
		});

		applyThemeMode("auto");
		expect(document.documentElement.getAttribute("data-theme")).toBeNull();
	});
});

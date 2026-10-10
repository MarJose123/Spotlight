/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { errorMessage, FEED_PATH, postSignInTarget } from "#/lib/auth.js";

describe("FEED_PATH", () => {
	it("is /feed", () => {
		expect(FEED_PATH).toBe("/feed");
	});
});

describe("postSignInTarget", () => {
	beforeEach(() => {
		Object.defineProperty(window, "location", {
			writable: true,
			value: { origin: "http://localhost:5173" },
		});
	});

	afterEach(() => {
		// Restore after each test
	});

	it("returns the pathname for a valid same-origin path", () => {
		expect(postSignInTarget("/feed")).toBe("/feed");
	});

	it("returns the pathname for a nested path", () => {
		expect(postSignInTarget("/users?tab=admin")).toBe("/users");
	});

	it("returns FEED_PATH for undefined redirectTo", () => {
		expect(postSignInTarget()).toBe(FEED_PATH);
	});

	it("returns FEED_PATH for empty string", () => {
		expect(postSignInTarget("")).toBe(FEED_PATH);
	});

	it("returns FEED_PATH for non-string redirectTo", () => {
		// @ts-expect-error testing non-string input
		expect(postSignInTarget(123)).toBe(FEED_PATH);
	});

	it("returns FEED_PATH for a backslash path that resolves to another origin", () => {
		// `/\evil.com` resolves against the origin and should be rejected
		expect(postSignInTarget("/\\evil.com")).toBe(FEED_PATH);
	});

	it("returns FEED_PATH for an absolute URL to another origin", () => {
		expect(postSignInTarget("https://evil.com/feed")).toBe(FEED_PATH);
	});
});

describe("errorMessage", () => {
	it("returns the error message for a non-empty Error", () => {
		expect(errorMessage(new Error("Something failed"), "Fallback")).toBe(
			"Something failed",
		);
	});

	it("returns the error message for a subclass of Error", () => {
		class CustomError extends Error {
			constructor(message: string) {
				super(message);
				this.name = "CustomError";
			}
		}
		expect(errorMessage(new CustomError("Custom fail"), "Fallback")).toBe(
			"Custom fail",
		);
	});

	it("returns the fallback for an empty Error message", () => {
		expect(errorMessage(new Error(""), "Fallback")).toBe("Fallback");
	});

	it("returns the fallback for a non-Error value", () => {
		expect(errorMessage("plain string", "Fallback")).toBe("Fallback");
	});

	it("returns the fallback for null", () => {
		expect(errorMessage(null, "Fallback")).toBe("Fallback");
	});

	it("returns the fallback for undefined", () => {
		expect(errorMessage(undefined, "Fallback")).toBe("Fallback");
	});

	it("returns the fallback for a number", () => {
		expect(errorMessage(404, "Not found")).toBe("Not found");
	});
});

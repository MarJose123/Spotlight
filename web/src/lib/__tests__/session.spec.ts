/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	authorizationHeaders,
	clearSession,
	isExpired,
	readSession,
	saveSession,
} from "#/lib/session.js";

const SESSION_KEY = "spotlight.session";

beforeEach(() => {
	localStorage.clear();
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe("saveSession", () => {
	it("saves tokens and computes expiresAt from now + expires_in", () => {
		vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

		const tokens = {
			access_token: "access-123",
			refresh_token: "refresh-456",
			expires_in: 300,
			token_type: "Bearer",
			user: {
				id: "u1",
				email: "a@b.com",
				name: "Test",
			},
		};

		const result = saveSession(tokens);

		expect(result.accessToken).toBe("access-123");
		expect(result.refreshToken).toBe("refresh-456");
		expect(result.expiresAt).toBe(Date.now() + 300_000);
		expect(result.user).toEqual(tokens.user);

		const stored = localStorage.getItem(SESSION_KEY);
		expect(stored).toBeDefined();
		const parsed = JSON.parse(stored as string);
		expect(parsed.accessToken).toBe("access-123");
	});

	it("handles missing user in tokens", () => {
		const tokens = {
			access_token: "access-123",
			refresh_token: "refresh-456",
			expires_in: 300,
			token_type: "Bearer",
		};

		const result = saveSession(tokens);
		expect(result.user).toBeNull();
	});
});

describe("readSession", () => {
	it("returns a session object for valid stored data", () => {
		const session = {
			accessToken: "access-123",
			refreshToken: "refresh-456",
			expiresAt: 9999999999999,
			user: { id: "u1", email: "a@b.com", name: "Test" },
		};

		localStorage.setItem(SESSION_KEY, JSON.stringify(session));
		const result = readSession();

		expect(result).not.toBeNull();
		expect(result?.accessToken).toBe("access-123");
		expect(result?.user).toEqual(session.user);
	});

	it("defaults missing refreshToken to empty string", () => {
		localStorage.setItem(
			SESSION_KEY,
			JSON.stringify({ accessToken: "a", expiresAt: 1 }),
		);
		const result = readSession();
		expect(result).not.toBeNull();
		expect(result?.refreshToken).toBe("");
	});

	it("defaults missing expiresAt to 0", () => {
		localStorage.setItem(
			SESSION_KEY,
			JSON.stringify({ accessToken: "a", refreshToken: "r" }),
		);
		const result = readSession();
		expect(result).not.toBeNull();
		expect(result?.expiresAt).toBe(0);
	});

	it("returns null when no session is stored", () => {
		expect(readSession()).toBeNull();
	});

	it("returns null for corrupted JSON", () => {
		localStorage.setItem(SESSION_KEY, "{not valid json");
		expect(readSession()).toBeNull();
	});

	it("returns null when accessToken is missing", () => {
		localStorage.setItem(SESSION_KEY, JSON.stringify({ refreshToken: "x" }));
		expect(readSession()).toBeNull();
	});

	it("returns null when accessToken is empty", () => {
		localStorage.setItem(SESSION_KEY, JSON.stringify({ accessToken: "" }));
		expect(readSession()).toBeNull();
	});
});

describe("clearSession", () => {
	it("removes the session from storage", () => {
		localStorage.setItem(SESSION_KEY, JSON.stringify({ accessToken: "a" }));
		clearSession();
		expect(localStorage.getItem(SESSION_KEY)).toBeNull();
		expect(readSession()).toBeNull();
	});
});

describe("isExpired", () => {
	it("returns false when expiresAt is in the future", () => {
		vi.setSystemTime(new Date("2026-01-01T00:01:00Z"));
		const session = {
			accessToken: "a",
			refreshToken: "r",
			expiresAt: new Date("2026-01-01T00:05:00Z").getTime(),
			user: null,
		};
		expect(isExpired(session)).toBe(false);
	});

	it("returns false when expiresAt is 0", () => {
		const session = {
			accessToken: "a",
			refreshToken: "r",
			expiresAt: 0,
			user: null,
		};
		expect(isExpired(session)).toBe(false);
	});

	it("returns true when expiresAt is in the past", () => {
		vi.setSystemTime(new Date("2026-01-01T00:05:00Z"));
		const session = {
			accessToken: "a",
			refreshToken: "r",
			expiresAt: new Date("2026-01-01T00:04:00Z").getTime(),
			user: null,
		};
		expect(isExpired(session)).toBe(true);
	});

	it("returns true when expiresAt equals now", () => {
		const now = Date.now();
		const session = {
			accessToken: "a",
			refreshToken: "r",
			expiresAt: now,
			user: null,
		};
		expect(isExpired(session)).toBe(true);
	});
});

describe("authorizationHeaders", () => {
	it("returns Bearer header when session exists", () => {
		localStorage.setItem(
			SESSION_KEY,
			JSON.stringify({ accessToken: "my-token", expiresAt: 9999999999999 }),
		);

		expect(authorizationHeaders()).toEqual({
			authorization: "Bearer my-token",
		});
	});

	it("returns empty object when no session exists", () => {
		expect(authorizationHeaders()).toEqual({});
	});
});

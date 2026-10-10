/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	base64Url,
	clearPendingAuthorization,
	createCodeChallenge,
	createCodeVerifier,
	createState,
	readPendingAuthorization,
	savePendingAuthorization,
} from "#/lib/pkce.js";

const PENDING_KEY = "spotlight.oauth.pending";

beforeEach(() => {
	sessionStorage.clear();
});

afterEach(() => {
	sessionStorage.clear();
});

describe("base64Url", () => {
	it("encodes bytes to base64url without padding", () => {
		const bytes = new Uint8Array([0x00, 0xff, 0x0a, 0x1b]);
		const result = base64Url(bytes);

		// Base64url uses - and _ instead of + and /
		expect(result).not.toContain("+");
		expect(result).not.toContain("/");
		expect(result).not.toContain("=");
	});

	it("produces deterministic output for the same input", () => {
		const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
		expect(base64Url(bytes)).toBe(base64Url(bytes));
	});

	it("encodes empty bytes to empty string", () => {
		expect(base64Url(new Uint8Array([]))).toBe("");
	});
});

describe("createCodeVerifier", () => {
	it("returns a base64url string", () => {
		const verifier = createCodeVerifier();
		expect(typeof verifier).toBe("string");
		expect(verifier).not.toContain("+");
		expect(verifier).not.toContain("/");
		expect(verifier).not.toContain("=");
	});

	it("returns a non-empty string", () => {
		expect(createCodeVerifier().length).toBeGreaterThan(0);
	});

	it("returns different values on subsequent calls", () => {
		const v1 = createCodeVerifier();
		const v2 = createCodeVerifier();
		expect(v1).not.toBe(v2);
	});
});

describe("createState", () => {
	it("returns a base64url string", () => {
		const state = createState();
		expect(typeof state).toBe("string");
		expect(state).not.toContain("+");
		expect(state).not.toContain("/");
		expect(state).not.toContain("=");
	});

	it("returns different values on subsequent calls", () => {
		const s1 = createState();
		const s2 = createState();
		expect(s1).not.toBe(s2);
	});
});

describe("createCodeChallenge", () => {
	it("returns a base64url string", async () => {
		const verifier = createCodeVerifier();
		const challenge = await createCodeChallenge(verifier);
		expect(typeof challenge).toBe("string");
		expect(challenge).not.toContain("+");
		expect(challenge).not.toContain("/");
		expect(challenge).not.toContain("=");
	});

	it("produces deterministic output for the same verifier", async () => {
		const verifier = "test-verifier-string";
		const c1 = await createCodeChallenge(verifier);
		const c2 = await createCodeChallenge(verifier);
		expect(c1).toBe(c2);
	});

	it("produces different challenges for different verifiers", async () => {
		const c1 = await createCodeChallenge("verifier-1");
		const c2 = await createCodeChallenge("verifier-2");
		expect(c1).not.toBe(c2);
	});
});

describe("savePendingAuthorization", () => {
	it("stores the pending authorization in sessionStorage", () => {
		const pending = {
			provider: "zoho",
			verifier: "test-verifier",
			state: "test-state",
		};

		savePendingAuthorization(pending);

		const stored = sessionStorage.getItem(PENDING_KEY);
		expect(stored).toBeDefined();
		const parsed = JSON.parse(stored as string);
		expect(parsed.provider).toBe("zoho");
		expect(parsed.verifier).toBe("test-verifier");
	});

	it("stores redirectTo when provided", () => {
		const pending = {
			provider: "zoho",
			verifier: "v",
			state: "s",
			redirectTo: "/feed",
		};

		savePendingAuthorization(pending);
		const parsed = JSON.parse(sessionStorage.getItem(PENDING_KEY) as string);
		expect(parsed.redirectTo).toBe("/feed");
	});
});

describe("readPendingAuthorization", () => {
	it("returns the pending authorization for valid data", () => {
		const pending = {
			provider: "zoho",
			verifier: "v",
			state: "s",
			redirectTo: "/feed",
		};
		sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));

		const result = readPendingAuthorization();
		expect(result).not.toBeNull();
		expect(result?.provider).toBe("zoho");
		expect(result?.verifier).toBe("v");
		expect(result?.redirectTo).toBe("/feed");
	});

	it("defaults redirectTo to undefined when not stored", () => {
		sessionStorage.setItem(
			PENDING_KEY,
			JSON.stringify({ provider: "zoho", verifier: "v", state: "s" }),
		);
		const result = readPendingAuthorization();
		expect(result).not.toBeNull();
		expect(result?.redirectTo).toBeUndefined();
	});

	it("returns null when nothing is stored", () => {
		expect(readPendingAuthorization()).toBeNull();
	});

	it("returns null for corrupted JSON", () => {
		sessionStorage.setItem(PENDING_KEY, "{invalid json");
		expect(readPendingAuthorization()).toBeNull();
	});

	it("returns null when provider is missing", () => {
		sessionStorage.setItem(
			PENDING_KEY,
			JSON.stringify({ verifier: "v", state: "s" }),
		);
		expect(readPendingAuthorization()).toBeNull();
	});

	it("returns null when verifier is missing", () => {
		sessionStorage.setItem(
			PENDING_KEY,
			JSON.stringify({ provider: "zoho", state: "s" }),
		);
		expect(readPendingAuthorization()).toBeNull();
	});

	it("returns null when state is missing", () => {
		sessionStorage.setItem(
			PENDING_KEY,
			JSON.stringify({ provider: "zoho", verifier: "v" }),
		);
		expect(readPendingAuthorization()).toBeNull();
	});

	it("returns null when provider is not a string", () => {
		sessionStorage.setItem(
			PENDING_KEY,
			JSON.stringify({ provider: 123, verifier: "v", state: "s" }),
		);
		expect(readPendingAuthorization()).toBeNull();
	});
});

describe("clearPendingAuthorization", () => {
	it("removes the pending authorization from storage", () => {
		sessionStorage.setItem(
			PENDING_KEY,
			JSON.stringify({ provider: "zoho", verifier: "v", state: "s" }),
		);
		clearPendingAuthorization();
		expect(sessionStorage.getItem(PENDING_KEY)).toBeNull();
		expect(readPendingAuthorization()).toBeNull();
	});
});

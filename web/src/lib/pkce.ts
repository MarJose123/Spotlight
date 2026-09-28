/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

/**
 * PKCE and CSRF values for the social sign-in redirect.
 *
 * The verifier never reaches the API until the code is exchanged, so it is kept
 * in `sessionStorage`: same tab, cleared by the browser, and gone the moment the
 * tab closes — which is exactly the lifetime of a sign-in attempt.
 */
const PENDING_KEY = "spotlight.oauth.pending";

const VERIFIER_BYTES = 32;
const STATE_BYTES = 16;

export interface PendingAuthorization {
	provider: string;
	verifier: string;
	state: string;
	redirectTo?: string;
}

function randomBytes(length: number): Uint8Array {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);

	return bytes;
}

export function base64Url(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

export function createCodeVerifier(): string {
	return base64Url(randomBytes(VERIFIER_BYTES));
}

export function createState(): string {
	return base64Url(randomBytes(STATE_BYTES));
}

export async function createCodeChallenge(verifier: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(verifier),
	);

	return base64Url(new Uint8Array(digest));
}

function storage(): Storage | null {
	try {
		return typeof window === "undefined" ? null : window.sessionStorage;
	} catch {
		return null;
	}
}

export function savePendingAuthorization(pending: PendingAuthorization): void {
	storage()?.setItem(PENDING_KEY, JSON.stringify(pending));
}

export function readPendingAuthorization(): PendingAuthorization | null {
	const raw = storage()?.getItem(PENDING_KEY);
	if (!raw) return null;

	try {
		const value = JSON.parse(raw) as Partial<PendingAuthorization>;
		if (
			typeof value.provider !== "string" ||
			typeof value.verifier !== "string" ||
			typeof value.state !== "string"
		) {
			return null;
		}

		return {
			provider: value.provider,
			verifier: value.verifier,
			state: value.state,
			redirectTo: value.redirectTo,
		};
	} catch {
		return null;
	}
}

export function clearPendingAuthorization(): void {
	storage()?.removeItem(PENDING_KEY);
}

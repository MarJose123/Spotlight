/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import {
	exchangeAuthorizationCode,
	fetchAuthorizeUrl,
	loginWithCredentials,
	logout,
} from "./api";
import {
	clearPendingAuthorization,
	createCodeChallenge,
	createCodeVerifier,
	createState,
	readPendingAuthorization,
	savePendingAuthorization,
} from "./pkce";
import type { SignInValues } from "./schemas/auth";
import {
	clearSession,
	readSession,
	type Session,
	saveSession,
} from "./session";

/** Where a finished sign-in lands when nothing more specific was requested. */
export const FEED_PATH = "/feed";

/**
 * Only same-origin paths are honoured. Resolves against the origin so a crafted
 * `?redirect=` (e.g. `/\evil.com`) cannot bounce a freshly authenticated visitor
 * to another host via WHATWG URL parsing.
 */
export function postSignInTarget(redirectTo?: string): string {
	if (typeof redirectTo !== "string" || redirectTo === "") {
		return FEED_PATH;
	}

	// Resolve against the origin to neutralize backslash tricks like `/\evil.com`.
	const resolved = new URL(redirectTo, window.location.origin);
	if (resolved.origin !== window.location.origin) {
		return FEED_PATH;
	}

	return resolved.pathname;
}

export async function signInWithPassword(
	values: SignInValues,
): Promise<Session> {
	return saveSession(await loginWithCredentials(values));
}

export async function beginProviderSignIn(
	provider: string,
	redirectTo?: string,
): Promise<void> {
	const verifier = createCodeVerifier();
	const state = createState();
	const codeChallenge = await createCodeChallenge(verifier);

	savePendingAuthorization({ provider, verifier, state, redirectTo });

	window.location.assign(
		await fetchAuthorizeUrl(provider, { codeChallenge, state }),
	);
}

export async function completeProviderSignIn(callback: {
	code: string;
	state: string;
}): Promise<string> {
	const pending = readPendingAuthorization();

	if (!pending) {
		throw new Error(
			"This sign-in attempt has expired. Start again from the sign-in page.",
		);
	}

	if (pending.state !== callback.state) {
		clearPendingAuthorization();
		throw new Error(
			"The provider response did not match this sign-in attempt, so it was discarded.",
		);
	}

	const tokens = await exchangeAuthorizationCode(pending.provider, {
		code: callback.code,
		codeVerifier: pending.verifier,
	});

	saveSession(tokens);
	clearPendingAuthorization();

	return postSignInTarget(pending.redirectTo);
}

export function errorMessage(error: unknown, fallback: string): string {
	return error instanceof Error && error.message !== ""
		? error.message
		: fallback;
}

/**
 * Revoke the refresh token on the server, clear the local session, and
 * navigate to the sign-in page. The local session is always cleared even if
 * the server call fails, so the user is never stuck in a dead state.
 */
export async function performLogout(): Promise<void> {
	const session = readSession();
	if (session) {
		void logout(session.refreshToken).catch(() => {
			// Best-effort: the local session is already gone, so a server error
			// does not block the user from signing back in.
		});
	}
	clearSession();
	window.location.assign("/signin");
}

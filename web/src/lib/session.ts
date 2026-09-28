/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

const SESSION_KEY = "spotlight.session";

/** Subset of the API's `UserResponseDto` the UI needs to render a session. */
export interface SessionUser {
	id: string;
	email: string;
	name: string;
	displayName?: string;
	username?: string;
	avatarUrl?: string;
}

/** The pair `POST /auth/login` and `POST /auth/:provider/exchange` both return. */
export interface AuthTokens {
	user?: SessionUser | null;
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
}

export interface Session {
	accessToken: string;
	refreshToken: string;
	/** Epoch milliseconds; the API's `expires_in` is a duration in seconds. */
	expiresAt: number;
	user: SessionUser | null;
}

function storage(): Storage | null {
	try {
		return typeof window === "undefined" ? null : window.localStorage;
	} catch {
		// Blocked storage (Safari private mode, third-party cookie policy) is not
		// fatal: the app still renders, it just cannot keep a session.
		return null;
	}
}

function parse(raw: string | null): Session | null {
	if (!raw) return null;

	try {
		const value = JSON.parse(raw) as Partial<Session>;
		if (typeof value.accessToken !== "string" || value.accessToken === "") {
			return null;
		}

		return {
			accessToken: value.accessToken,
			refreshToken:
				typeof value.refreshToken === "string" ? value.refreshToken : "",
			expiresAt: typeof value.expiresAt === "number" ? value.expiresAt : 0,
			user: value.user ?? null,
		};
	} catch {
		return null;
	}
}

export function saveSession(tokens: AuthTokens): Session {
	const session: Session = {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		expiresAt: Date.now() + tokens.expires_in * 1000,
		user: tokens.user ?? null,
	};

	storage()?.setItem(SESSION_KEY, JSON.stringify(session));

	return session;
}

export function readSession(): Session | null {
	return parse(storage()?.getItem(SESSION_KEY) ?? null);
}

export function clearSession(): void {
	storage()?.removeItem(SESSION_KEY);
}

export function isExpired(session: Session): boolean {
	return session.expiresAt > 0 && session.expiresAt <= Date.now();
}

export function authorizationHeaders(): Record<string, string> {
	const session = readSession();

	return session ? { authorization: `Bearer ${session.accessToken}` } : {};
}

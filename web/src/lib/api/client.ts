/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import type { Session } from "../session";
import {
	authorizationHeaders,
	clearSession,
	readSession,
	saveSession,
} from "../session";

/** Empty means same-origin, which the dev proxy and a reverse proxy both expect. */
const PUBLIC_API_ORIGIN = (import.meta.env.VITE_API_URL ?? "").replace(
	/\/+$/,
	"",
);

/**
 * Server rendering cannot resolve the browser's relative URL, and the browser
 * cannot resolve a container service name. `API_INTERNAL_URL` is deliberately
 * not `VITE_`-prefixed, so it stays out of the client bundle.
 */
const API_ORIGIN = import.meta.env.SSR
	? process.env.API_INTERNAL_URL || PUBLIC_API_ORIGIN || "http://localhost:3000"
	: PUBLIC_API_ORIGIN;

const API_PREFIX = "/api/v1";

/** A rejected API call, carrying the status so callers can branch on it. */
export class ApiError extends Error {
	readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

/**
 * Nest's exception filter answers with `{ message }`, but validation failures
 * put a field-keyed record there instead of a sentence.
 */
function readMessage(payload: unknown, status: number): string {
	const fallback = `The server rejected that request (${status}).`;

	if (typeof payload === "string" && payload.trim() !== "") {
		return payload;
	}

	if (typeof payload !== "object" || payload === null) {
		return fallback;
	}

	const { message } = payload as { message?: unknown };

	if (typeof message === "string" && message.trim() !== "") {
		return message;
	}

	if (Array.isArray(message)) {
		const first = message.find((entry) => typeof entry === "string");
		return typeof first === "string" ? first : fallback;
	}

	if (typeof message === "object" && message !== null) {
		const first = Object.values(message)
			.flat()
			.find((entry) => typeof entry === "string");
		return typeof first === "string" ? first : fallback;
	}

	return fallback;
}

export async function requestJson<T>(
	path: string,
	init: RequestInit,
): Promise<T> {
	let response: Response;

	try {
		response = await fetch(`${API_ORIGIN}${API_PREFIX}${path}`, init);
	} catch {
		throw new ApiError(
			"Spotlight could not be reached. Check your connection and try again.",
			0,
		);
	}

	const body: unknown = await response.json().catch(() => null);

	if (!response.ok) {
		throw new ApiError(readMessage(body, response.status), response.status);
	}

	return body as T;
}

/**
 * Like `requestJson`, but attaches the current session's authorization header.
 * If the server answers 401, it automatically refreshes the token and retries
 * once.
 */
export async function requestJsonAuth<T>(
	path: string,
	init: RequestInit,
): Promise<T> {
	const headers = { ...authorizationHeaders(), ...init.headers };

	let response: Response;

	try {
		response = await fetch(`${API_ORIGIN}${API_PREFIX}${path}`, {
			...init,
			headers,
		});
	} catch {
		throw new ApiError(
			"Spotlight could not be reached. Check your connection and try again.",
			0,
		);
	}

	// On any 401, try refreshing once before giving up — the token may be
	// expired, revoked, or otherwise invalid while still within its TTL.
	if (response.status === 401) {
		try {
			await refreshAccessTokenInternal();
		} catch {
			// Refresh failed — the session is dead. Let the 401 propagate so the
			// caller can redirect to sign-in.
		}

		// Retry with the new (or same) headers.
		const retryHeaders = { ...authorizationHeaders(), ...init.headers };
		try {
			response = await fetch(`${API_ORIGIN}${API_PREFIX}${path}`, {
				...init,
				headers: retryHeaders,
			});
		} catch {
			throw new ApiError(
				"Spotlight could not be reached. Check your connection and try again.",
				0,
			);
		}
	}

	const body: unknown = await response.json().catch(() => null);

	if (!response.ok) {
		throw new ApiError(readMessage(body, response.status), response.status);
	}

	return body as T;
}

// ── Token refresh (internal, used by requestJsonAuth and exported publicly) ──

import type { AuthTokens } from "../session";

async function refreshAccessTokenInternal(): Promise<Session> {
	const session = readSession();
	if (!session || session.refreshToken === "") {
		throw new ApiError("No refresh token available.", 401);
	}

	let response: Response;

	try {
		response = await fetch(`${API_ORIGIN}${API_PREFIX}/auth/refresh`, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				accept: "application/json",
			},
			body: JSON.stringify({ refresh_token: session.refreshToken }),
		});
	} catch {
		throw new ApiError(
			"Spotlight could not be reached. Check your connection and try again.",
			0,
		);
	}

	if (!response.ok) {
		clearSession();
		window.location.assign("/signin");
		throw new ApiError("Session expired.", response.status);
	}

	const tokens = (await response.json().catch(() => null)) as AuthTokens;
	return saveSession(tokens);
}

/**
 * Calls `POST /auth/refresh` with the stored refresh token and updates the
 * local session with the new access token. If the API returns a non-200 status,
 * the session is cleared and the user is redirected to the sign-in page.
 */
export { refreshAccessTokenInternal as refreshAccessToken };

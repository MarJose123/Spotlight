/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import type { SignInValues } from "./schemas/auth";
import type { AuthTokens } from "./session";

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

export interface EnabledProviders {
	ids: string[];
	/** `false` when the API could not be reached at all. */
	reachable: boolean;
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

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
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

/** Never throws: the sign-in page must still render while the API is down. */
export async function fetchEnabledProviders(): Promise<EnabledProviders> {
	try {
		const response = await fetch(`${API_ORIGIN}${API_PREFIX}/auth/providers`, {
			headers: { accept: "application/json" },
		});

		if (!response.ok) {
			return { ids: [], reachable: false };
		}

		const payload: unknown = await response.json();

		return {
			ids: Array.isArray(payload)
				? payload.filter((id): id is string => typeof id === "string")
				: [],
			reachable: true,
		};
	} catch {
		return { ids: [], reachable: false };
	}
}

export function loginWithCredentials(
	values: SignInValues,
): Promise<AuthTokens> {
	return requestJson<AuthTokens>("/auth/login", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			accept: "application/json",
		},
		body: JSON.stringify({
			email: values.email,
			password: values.password,
		}),
	});
}

export async function fetchAuthorizeUrl(
	provider: string,
	params: { codeChallenge: string; state: string },
): Promise<string> {
	const query = new URLSearchParams({
		code_challenge: params.codeChallenge,
		code_challenge_method: "S256",
		state: params.state,
	});

	const payload = await requestJson<{ url?: unknown }>(
		`/auth/${encodeURIComponent(provider)}/authorize-url?${query.toString()}`,
		{ headers: { accept: "application/json" } },
	);

	if (typeof payload.url !== "string" || payload.url === "") {
		throw new ApiError("The provider returned no authorization URL.", 500);
	}

	return payload.url;
}

export function exchangeAuthorizationCode(
	provider: string,
	params: { code: string; codeVerifier: string },
): Promise<AuthTokens> {
	return requestJson<AuthTokens>(
		`/auth/${encodeURIComponent(provider)}/exchange`,
		{
			method: "POST",
			headers: {
				"content-type": "application/json",
				accept: "application/json",
			},
			body: JSON.stringify({
				code: params.code,
				code_verifier: params.codeVerifier,
			}),
		},
	);
}

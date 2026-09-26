/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

export interface OAuthProfile {
  email: string;
  emailVerified: boolean;
  name?: string;
  avatar?: string;
}

export interface OAuthAuthorizeParams {
  /** `BASE64URL(SHA256(code_verifier))` — the PKCE challenge. */
  codeChallenge: string;
  /** Opaque CSRF value the client generates and verifies on return. */
  state: string;
}

/**
 * Not a Passport strategy: those own the browser redirect and keep the PKCE
 * verifier server-side, which is exactly the state this design avoids.
 */
export interface OAuthStrategy {
  /** Registry key and the `:provider` path segment. */
  readonly name: string;

  isEnabled(): boolean;

  authorizeUrl(params: OAuthAuthorizeParams): string;

  profile(code: string, codeVerifier: string): Promise<OAuthProfile>;
}

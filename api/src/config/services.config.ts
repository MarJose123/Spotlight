/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { registerAs } from '@nestjs/config';

export interface ZohoServiceConfig {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  /** The client route Zoho returns the browser to, not an API route. */
  callbackUrl?: string;
  accountServer: string;
  scope: string[];
}

export default registerAs('services', () => ({
  /**
   * Domains allowed to sign in. Empty is only safe when each provider already
   * restricts its own tenant, because email is the only thing sign-in matches.
   */
  allowedDomains: (process.env.OAUTH_ALLOWED_DOMAINS ?? '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean),

  google: {
    enabled: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    ),
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    scope: ['email', 'profile'],
  },
  github: {
    enabled: Boolean(
      process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
    ),
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl: process.env.GITHUB_CALLBACK_URL,
  },
  microsoft: {
    enabled: Boolean(
      process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET,
    ),
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackUrl: process.env.MICROSOFT_CALLBACK_URL,
    tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
    scope: ['User.Read', 'profile'],
  },
  zoho: {
    enabled: Boolean(
      process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET,
    ),
    clientId: process.env.ZOHO_CLIENT_ID,
    clientSecret: process.env.ZOHO_CLIENT_SECRET,
    callbackUrl: process.env.ZOHO_CALLBACK_URL,
    // Zoho shards accounts by data centre: use the one the client was
    // registered in (`.com`, `.eu`, `.in`, `.com.au`, `.jp`, `.ca`, `.sa`).
    accountServer: (
      process.env.ZOHO_ACCOUNT_SERVER || 'https://accounts.zoho.com'
    ).replace(/\/+$/, ''),
    scope: ['openid', 'email', 'profile'],
  },
}));

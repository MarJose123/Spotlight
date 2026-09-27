/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

/** Empty means same-origin, which the dev proxy and a reverse proxy both expect. */
const PUBLIC_API_ORIGIN = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

/**
 * Server rendering cannot resolve the browser's relative URL, and the browser
 * cannot resolve a container service name. `API_INTERNAL_URL` is deliberately
 * not `VITE_`-prefixed, so it stays out of the client bundle.
 */
const API_ORIGIN = import.meta.env.SSR
  ? process.env.API_INTERNAL_URL || PUBLIC_API_ORIGIN || 'http://localhost:3000'
  : PUBLIC_API_ORIGIN

const API_PREFIX = '/api/v1'

export interface EnabledProviders {
  ids: string[]
  /** `false` when the API could not be reached at all. */
  reachable: boolean
}

/** Never throws: the sign-in page must still render while the API is down. */
export async function fetchEnabledProviders(): Promise<EnabledProviders> {
  try {
    const response = await fetch(`${API_ORIGIN}${API_PREFIX}/auth/providers`, {
      headers: { accept: 'application/json' },
    })

    if (!response.ok) {
      return { ids: [], reachable: false }
    }

    const payload: unknown = await response.json()

    return {
      ids: Array.isArray(payload)
        ? payload.filter((id): id is string => typeof id === 'string')
        : [],
      reachable: true,
    }
  } catch {
    return { ids: [], reachable: false }
  }
}

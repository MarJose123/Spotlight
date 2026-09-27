/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { useRouter, useRouterState } from '@tanstack/react-router'
import NotFoundPage from './NotFoundPage'
import ServerErrorPage from './ServerErrorPage'

import type { ErrorComponentProps } from '@tanstack/react-router'

/**
 * Rendered when a URL matches no route, or when a loader calls `notFound()`.
 * Registered on the root route and as the router-wide
 * `defaultNotFoundComponent`, because TanStack Router does not inherit
 * not-found components down the route tree.
 */
export function StatusNotFound() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return <NotFoundPage pathname={pathname} />
}

/**
 * Rendered when a loader, server function, or route component throws.
 * Registered on the root route and as the router-wide
 * `defaultErrorComponent`, which is what child routes actually fall back to.
 *
 * Missing sessions do not belong here: throw `throwUnauthorized()` from a
 * `beforeLoad` guard instead, because an error's HTTP status does not survive
 * the server-to-client payload and would hydrate into the wrong page.
 */
export function StatusErrorBoundary({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  // Clear the boundary and re-run whatever failed before showing this page.
  const retry = () => {
    reset?.()
    void router.invalidate()
  }

  return <ServerErrorPage error={error} reset={retry} />
}

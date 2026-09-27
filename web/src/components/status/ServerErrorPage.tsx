/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Link } from '@tanstack/react-router'
import { Home, RefreshCw, TriangleAlert } from 'lucide-react'
import StatusPage, {
  statusPrimaryActionClass,
  statusSecondaryActionClass,
} from './StatusPage'

type ServerErrorPageProps = {
  error?: unknown
  reset?: () => void
}

/** Best-effort human-readable detail for the dev-only technical block. */
function describeError(error: unknown): string | null {
  if (typeof error === 'string') return error
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`
  }
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return null
}

export default function ServerErrorPage({ error, reset }: ServerErrorPageProps) {
  const detail = import.meta.env.DEV ? describeError(error) : null

  // The button always renders so the server-rendered error page and the
  // hydrated one match: the router passes `reset: undefined` during SSR but a
  // live reset on the client. Reloading covers the case where no boundary
  // supplies one.
  const handleRetry = () => {
    if (reset) {
      reset()
      return
    }
    if (typeof window !== 'undefined') window.location.reload()
  }

  return (
    <StatusPage
      code={500}
      kicker="Server error"
      icon={TriangleAlert}
      title="Something broke on our side."
      description="The request could not be completed. Try again in a moment — if it keeps happening, let the team know what you were doing."
      details={
        detail ? (
          <details className="mx-auto mt-6 max-w-lg text-left">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--sea-ink-soft)]">
              Technical details
            </summary>
            <pre className="demo-code-block mt-3 max-h-56 overflow-auto text-xs whitespace-pre-wrap">
              {detail}
            </pre>
          </details>
        ) : null
      }
      actions={
        <>
          <button
            type="button"
            onClick={handleRetry}
            className={statusPrimaryActionClass}
          >
            <RefreshCw className="h-4 w-4" aria-hidden={true} />
            Try again
          </button>
          <Link to="/" className={statusSecondaryActionClass}>
            <Home className="h-4 w-4" aria-hidden={true} />
            Back to Spotlight
          </Link>
        </>
      }
    />
  )
}

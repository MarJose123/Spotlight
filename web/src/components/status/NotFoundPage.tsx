/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Link } from '@tanstack/react-router'
import { Compass, Home } from 'lucide-react'
import StatusPage, { statusPrimaryActionClass } from './StatusPage'

type NotFoundPageProps = {
  /** Path the visitor tried to open, when known. */
  pathname?: string
}

export default function NotFoundPage({ pathname }: NotFoundPageProps) {
  return (
    <StatusPage
      code={404}
      kicker="Not found"
      icon={Compass}
      title="This page went missing."
      description="The link may be broken, or the page may have been moved or renamed. Check the address and try again."
      details={
        pathname ? (
          <p className="mx-auto mt-5 mb-0 text-sm text-[var(--sea-ink-soft)]">
            Requested: <code>{pathname}</code>
          </p>
        ) : null
      }
      actions={
        <Link to="/" className={statusPrimaryActionClass}>
          <Home className="h-4 w-4" aria-hidden={true} />
          Back to Spotlight
        </Link>
      }
    />
  )
}

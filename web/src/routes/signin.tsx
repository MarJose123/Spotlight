/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { createFileRoute } from '@tanstack/react-router';
import { LogIn } from 'lucide-react';

export const Route = createFileRoute('/signin')({
  component: SignIn,
})

const PROVIDERS_SIGN_IN: Array<{ name: string, label: string, }>  = [
  {
    name: 'google',
    label: 'Google'
  },
  {
    name: 'microsoft',
    label: 'Microsoft'
  },
  {
    name: 'zoho',
    label: 'Zoho'
  }
]

function SignIn() {
  return (
    <main className="page-wrap px-4 py-16">
      <section className="island-shell rise-in mx-auto w-full max-w-md rounded-[2rem] px-8 py-14 text-center">
        <p className="island-kicker mb-4">Internal recognition</p>
        <h1 className="display-title m-0 text-5xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Spotlight
        </h1>
        <p className="mx-auto mt-5 mb-0 max-w-xs text-base leading-4 text-[var(--sea-ink-soft)]">
          Celebrate great work. Recognize your teammates.
        </p>

        <div className="flex flex-col items-center gap-1 mt-5">
          {PROVIDERS_SIGN_IN.map((provider) => (
            <button
              type="button"
              key={provider.name}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-4 py-2 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
            >
              <LogIn className="h-4 w-4" aria-hidden={true} />
              Sign in with {provider.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

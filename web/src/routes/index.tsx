/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { createFileRoute } from '@tanstack/react-router'
import { Heart, LogIn, Megaphone, Newspaper, Users } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

export const Route = createFileRoute('/')({ component: Home })

type Icon = ComponentType<SVGProps<SVGSVGElement>>

const CARDS: Array<{ icon: Icon; title: string; description: string }> = [
  {
    icon: Megaphone,
    title: 'Recognitions',
    description:
      'Post a commendation or shout-out, with an optional image, GIF, or video.',
  },
  {
    icon: Heart,
    title: 'Likes',
    description:
      'Like a post to show appreciation, with a count on every recognition.',
  },
  {
    icon: Newspaper,
    title: 'Feeds',
    description: 'Read every recognition, or filter the feed to one author.',
  },
  {
    icon: Users,
    title: 'People',
    description: 'Employee records with active or inactive status.',
  },
]

function Home() {
  return (
    <main className="page-wrap px-4 py-16">
      <section className="island-shell rise-in mx-auto w-full max-w-md rounded-[2rem] px-8 py-14 text-center">
        <p className="island-kicker mb-4">Internal recognition</p>
        <h1 className="display-title m-0 text-5xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Spotlight
        </h1>
        <p className="mx-auto mt-5 mb-0 max-w-xs text-base leading-7 text-[var(--sea-ink-soft)]">
          Recognize great work across your team.
        </p>
        <button
          type="button"
          className="mt-8 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-6 py-3 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
        >
          <LogIn className="h-4 w-4" aria-hidden={true} />
          Sign in
        </button>
      </section>

      <section className="mx-auto mt-8 grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map(({ icon: CardIcon, title, description }, index) => (
          <article
            key={title}
            className="island-shell feature-card rise-in rounded-2xl p-5"
            style={{ animationDelay: `${index * 70 + 80}ms` }}
          >
            <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--lagoon-deep)]">
              <CardIcon className="h-5 w-5" aria-hidden={true} />
            </span>
            <h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">
              {title}
            </h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">
              {description}
            </p>
          </article>
        ))}
      </section>
    </main>
  )
}

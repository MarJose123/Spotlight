/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({ component: About })

const SOURCE_URL = 'https://github.com/MarJose123/spotlight'
const API_DOCS_URL = 'http://localhost:3000/docs'

const FACTS: Array<[string, string]> = [
  ['What it is', 'An internal recognition tool for celebrating coworkers.'],
  [
    'Who it is for',
    'Teams that want achievements to stay visible across the organization.',
  ],
  ['How it runs', 'Self-hosted: NestJS API, PostgreSQL, and S3-compatible media.'],
  ['License', 'GNU Affero General Public License, version 3 only.'],
]

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">About</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          Recognition, kept in the open.
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
          Spotlight is an internal recognition tool that helps teams celebrate
          and appreciate their coworkers. Employees post commendations and
          shout-outs — optionally with an image, GIF, or video — and everyone
          can like the posts worth celebrating. Achievements end up on a shared
          feed instead of scrolling past in a chat channel.
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {FACTS.map(([label, value]) => (
          <article
            key={label}
            className="island-shell feature-card rounded-2xl p-5"
          >
            <h2 className="island-kicker mb-2">{label}</h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{value}</p>
          </article>
        ))}
      </section>

      <section className="island-shell mt-8 rounded-2xl p-6">
        <p className="island-kicker mb-2">Keep exploring</p>
        <ul className="m-0 list-disc space-y-2 pl-5 text-sm text-[var(--sea-ink-soft)]">
          <li>
            Browse the interactive API reference at{' '}
            <a href={API_DOCS_URL} target="_blank" rel="noopener noreferrer">
              the Scalar docs
            </a>
            .
          </li>
          <li>
            Read the source and file issues on{' '}
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            .
          </li>
          <li>
            Because Spotlight is network-accessible, AGPLv3 Section 13 applies:
            the footer's <strong>Source code</strong> link points at the exact
            code running here.
          </li>
        </ul>
      </section>
    </main>
  )
}

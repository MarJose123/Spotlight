/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
/**
 * AGPLv3 Section 13 requires that users who interact with this program remotely
 * over a network are prominently offered the Corresponding Source of the exact
 * version they are using. Point this at the repository or source archive that
 * serves the code actually deployed here — never at an unrelated project.
 */
const SOURCE_URL = 'https://github.com/MarJose123/spotlight'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-[var(--line)] px-4 pb-14 pt-10 text-[var(--sea-ink-soft)]">
      <div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="m-0 text-sm">
          &copy; {year} Marjose Darang &middot; Licensed under the{' '}
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.html"
            target="_blank"
            rel="noreferrer"
            className="underline transition hover:text-[var(--sea-ink)]"
          >
            GNU AGPLv3
          </a>
        </p>
        <p className="island-kicker m-0">
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer"
            className="underline transition hover:text-[var(--sea-ink)]"
          >
            Source code
          </a>
        </p>
      </div>
    </footer>
  )
}

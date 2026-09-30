/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { pixelBasedPreset, type TailwindConfig } from 'react-email';

/**
 * The Spotlight email theme: the tokens the web app declares in
 * `web/src/styles.css` and `web/src/theme.ts`, resolved to the values an email
 * client can actually render. Clients drop `color-mix()`, ignore `oklab()`,
 * and paint rgba as opaque, so every translucent token is pre-blended against
 * the surface it sits on.
 *
 * `<Tailwind config={emailTailwindConfig}>` inlines the classes it generates
 * into the markup before the mail leaves the process — no client we care about
 * will load a stylesheet we attach. Templates should reach for the class names
 * this config produces (`text-ink`, `bg-lagoon`, `shadow-card`, …) instead of
 * hard-coding values, so a palette change lands in every existing email at
 * once.
 *
 * `pixelBasedPreset` keeps spacing and type in px. Tailwind's default scale is
 * rem-based, and the clients that do support rem disagree about the root font
 * size, so `p-8` has to mean 32px and not "2 of whatever the client picked".
 */
export const emailTailwindConfig: TailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        /** `--bg-base` */
        page: '#e7f3ec',
        /** `--surface-strong`, the white card the app floats over the page. */
        surface: '#ffffff',
        /** `--line`, rgba(23, 58, 64, 0.14) blended into the page. */
        line: '#cad9d4',
        /** `--sea-ink`, the app's text and display-heading colour. */
        ink: '#173a40',
        /** `--sea-ink-soft`, used for paragraph copy in the app. */
        'ink-soft': '#416166',
        /** `--sea-ink-soft` at 60% over the card, for the faded footer. */
        'ink-muted': '#8da0a3',
        /** `--lagoon-deep`, the shade primary buttons and links fill with. */
        lagoon: '#328f97',
        /** `--kicker`, rgba(47, 106, 74, 0.9) blended into the card. */
        kicker: '#44795c',
      },
      backgroundImage: {
        /**
         * `--foam` fading into `--bg-base`, the light page wash of the app's
         * `body` gradient. Clients that refuse gradients keep `bg-page`.
         */
        'page-wash': 'linear-gradient(180deg, #f3faf5 0%, #e7f3ec 100%)',
      },
      fontFamily: {
        /** `fontFamily` of the Mantine theme. */
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        /** `headings.fontFamily` of the Mantine theme. */
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        /** `rounded-2xl` on `island-shell` and Mantine's `Paper radius="lg"`. */
        card: '16px',
      },
      boxShadow: {
        /** `.island-shell`, the soft lift the app cards carry. */
        card: '0 22px 44px rgba(30, 90, 72, 0.1), 0 4px 14px rgba(23, 58, 64, 0.06)',
      },
    },
  },
};

/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */

import { z } from 'zod'

/**
 * Mirrors the API's `CredentialLoginDto`: login needs a valid email and a
 * non-empty password only, so the registration length rules cannot lock out a
 * credential issued under older rules.
 */
export const signInSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

export type SignInValues = z.infer<typeof signInSchema>

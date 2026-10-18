/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { registerAs } from '@nestjs/config';

export interface LeaderboardConfig {
  /** Default monthly points budget — seeds the AppSettings DB record. */
  monthlyPoints: number;
}

export default registerAs<LeaderboardConfig>('leaderboard', () => ({
  monthlyPoints: parseInt(process.env.LEADERBOARD_MONTHLY_POINTS || '100', 10),
}));

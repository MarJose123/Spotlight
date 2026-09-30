/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { registerAs } from '@nestjs/config';

export interface AppConfig {
  name: string;
  key: string;
  /** Base URL of the web client, used to build links embedded in emails. */
  url: string;
}

export default registerAs<AppConfig>('app', () => ({
  name: process.env.APP_NAME || 'Spotlight',
  key: process.env.APP_KEY || 'spotlight',
  url: (process.env.WEB_URL || 'http://localhost:5173').replace(/\/+$/, ''),
}));

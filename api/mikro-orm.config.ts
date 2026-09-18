/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import 'dotenv/config';
import databaseConfig from './src/config/database.config';
import { buildMikroOrmOptions } from './src/config/mikro-orm.config';

/**
 * MikroORM CLI entrypoint (e.g. `mikro-orm migration:create`).
 *
 * At runtime the NestJS application builds the same options from the
 * `ConfigService` (see `src/app.module.ts`), so the driver and credentials
 * stay driven by environment variables in both cases.
 */
export default buildMikroOrmOptions(databaseConfig());

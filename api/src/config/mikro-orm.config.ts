/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import type { Options } from '@mikro-orm/core';
import type { DatabaseConfig } from './database.config';
import { SeedManager } from '@mikro-orm/seeder';
import { Migrator } from '@mikro-orm/migrations';
import { MySqlDriver } from '@mikro-orm/mysql';

function isDevelopment(): boolean {
  return (process.env.NODE_ENV ?? 'development') === 'development';
}

/**
 * Builds the MikroORM options for the driver selected through the
 * `DB_CONNECTION` environment variable (`sqlite` or `postgres`).
 */
export function buildMikroOrmOptions(db: DatabaseConfig): Partial<Options> {
  const common = {
    entities: ['./dist/**/*.entity.js'],
    entitiesTs: ['./src/**/*.entity.ts'],
    metadataProvider: TsMorphMetadataProvider,
    debug: isDevelopment(),
    extensions: [SeedManager, Migrator],
    seeder: {
      path: './dist/database/seeders',
      pathTs: './src/database/seeders',
      defaultSeeder: 'DatabaseSeeder',
      glob: '!(*.d).{js,ts}',
    },
    migrations: {
      tableName: 'migrations',
      path: './dist/database/migrations',
      pathTs: './src/database/migrations',
      glob: '!(*.d).{js,ts}',
      transactional: true,
    },
  };

  if (db.connection === 'mariadb' || db.connection === 'mysql') {
    return {
      ...common,
      driver: MySqlDriver,
      dbName: db.database,
      host: db.host,
      port: db.port,
      user: db.username,
      password: db.password,
    };
  }

  return {
    ...common,
    driver: PostgreSqlDriver,
    dbName: db.database,
    host: db.host,
    port: db.port,
    user: db.username,
    password: db.password,
  };
}

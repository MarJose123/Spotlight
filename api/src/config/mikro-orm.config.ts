import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import type { Options } from '@mikro-orm/core';
import { closeSync, existsSync, mkdirSync, openSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { DatabaseConfig } from './database.config';
import { SeedManager } from '@mikro-orm/seeder';
import { Migrator } from '@mikro-orm/migrations';
import { MySqlDriver } from '@mikro-orm/mysql';

function isDevelopment(): boolean {
  return (process.env.NODE_ENV ?? 'development') === 'development';
}

/**
 * Ensures the SQLite database file exists before MikroORM connects to it.
 *
 * In development, when the database is not present yet (first run), it is
 * created programmatically together with its parent directory
 * (better-sqlite3 can create a missing file, but not a missing directory).
 */
function ensureSqliteDatabaseFile(dbName: string): void {
  const filePath = resolve(process.cwd(), dbName);
  if (!existsSync(filePath)) {
    mkdirSync(dirname(filePath), { recursive: true });
    closeSync(openSync(filePath, 'a'));
  }
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

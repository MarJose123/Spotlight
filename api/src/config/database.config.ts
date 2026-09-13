import { registerAs } from '@nestjs/config';

export type DatabaseConnection = 'sqlite' | 'postgres';

export interface DatabaseConfig {
  /** Database driver to use: `sqlite` (default) or `postgres`. */
  connection: DatabaseConnection;
  /**
   * SQLite: path to the database file (relative to the project root).
   * PostgreSQL: name of the database/schema to connect to.
   */
  database: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
}

/** Values of `DB_CONNECTION` that select the PostgreSQL driver. */
const POSTGRES_CONNECTIONS = new Set(['postgres', 'postgresql', 'pg']);

export default registerAs('database', (): DatabaseConfig => {
  const connection: DatabaseConnection = POSTGRES_CONNECTIONS.has(
    (process.env.DB_CONNECTION ?? 'sqlite').toLowerCase(),
  )
    ? 'postgres'
    : 'sqlite';

  return {
    connection,
    database:
      process.env.DB_DATABASE ??
      (connection === 'postgres' ? 'spotlight' : './src/database/spotlight.db'),
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT) || (connection === 'postgres' ? 5432 : 0),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  };
});

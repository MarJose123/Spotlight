import { registerAs } from '@nestjs/config';

export type DatabaseConnection = 'mysql' | 'mariadb' | 'postgres';

export interface DatabaseConfig {
  /** Database driver to use: `mysql`, `mariadb` or `postgres` (default) . */
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

export default registerAs('database', (): DatabaseConfig => {
  return {
    connection: (process.env.DB_CONNECTION ?? 'postgres') as DatabaseConnection,
    database: process.env.DB_DATABASE ?? 'postgres',
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  };
});

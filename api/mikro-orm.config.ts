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

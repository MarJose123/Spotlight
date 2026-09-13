import { registerAs } from '@nestjs/config';

export interface AppConfig {
  name: string;
  key: string;
}

export default registerAs<AppConfig>('app', () => ({
  name: process.env.APP_NAME || 'Spotlight',
  key: process.env.APP_KEY || 'spotlight',
}));

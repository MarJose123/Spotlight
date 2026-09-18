import { registerAs } from '@nestjs/config';

export default registerAs('bucket', () => ({
  region: process.env.BUCKET_REGION,
  accessKeyId: process.env.BUCKET_ACCESS_KEY_ID,
  secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY,
  bucketName: process.env.BUCKET_NAME,
  expiration: Number(process.env.BUCKET_EXPIRATION || 600), // 10 minutes
}));

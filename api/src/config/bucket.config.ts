/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { registerAs } from '@nestjs/config';

export default registerAs('bucket', () => ({
  endpoint: process.env.BUCKET_ENDPOINT,
  region: process.env.BUCKET_REGION,
  accessKeyId: process.env.BUCKET_ACCESS_KEY_ID,
  secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY,
  bucketName: process.env.BUCKET_NAME,
  expiration: Number(process.env.BUCKET_EXPIRATION || 600), // 10 minutes
}));

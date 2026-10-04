/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Module } from '@nestjs/common';
import { GifController } from '#/gif/gif.controller.js';
import { GifService } from '#/gif/gif.service.js';
import { AuthModule } from '#/auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [GifController],
  providers: [GifService],
})
export class GifModule {}

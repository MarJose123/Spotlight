/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '#/auth/guard/auth.guard.js';
import { BucketService } from '#/bucket/bucket.service.js';
import { ApiGetAttachment } from '#/posts/decorators/post-api.decorator.js';
import { ApiAuthenticated } from '#/common/decorators/api-authenticated.decorator.js';
import type { FastifyReply } from 'fastify';

/**
 * Serves attachment files by S3 key. Requires authentication — the frontend
 * fetches attachments with auth headers and converts them to blob URLs for
 * browser rendering.
 */
@ApiTags('Posts')
@ApiAuthenticated()
@UseGuards(Auth)
@Controller('posts')
export class AttachmentController {
  constructor(private readonly bucketService: BucketService) {}

  @ApiGetAttachment()
  @Get('/attachment/:key')
  async getAttachment(@Param('key') key: string, @Res() reply: FastifyReply) {
    const { body, contentType, contentLength } =
      await this.bucketService.getObjectStream(key);

    reply.header('Content-Type', contentType);
    reply.header('Content-Length', contentLength);
    reply.header('Cache-Control', 'public, max-age=31536000');
    return reply.send(body);
  }
}

/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

export interface FastifyMultipartFile {
  fieldname: string;
  filename: string;
  mimetype: string;
  encoding: string;
  buffer: Buffer;
}

/**
 * Interceptor that extracts multiple files and text fields from a Fastify multipart request.
 * Files are collected under the given field name pattern (e.g. 'file' matches 'file0', 'file1', ...).
 * Text fields are merged into request.body. The collected files are attached as request.files.
 */
@Injectable()
export class MultipartFileInterceptor implements NestInterceptor {
  constructor(private readonly fieldName: string) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();

    if (!request.isMultipart) {
      throw new BadRequestException('Request must be multipart/form-data');
    }

    const parts = request.parts();
    const files: FastifyMultipartFile[] = [];
    const body: Record<string, string> = {};

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname.startsWith(this.fieldName)) {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(chunk);
        }

        files.push({
          fieldname: part.fieldname,
          filename: part.filename,
          mimetype: part.mimetype,
          encoding: part.encoding,
          buffer: Buffer.concat(chunks),
        });
      } else if (part.type === 'field') {
        const fieldPart = part as { fieldname: string; value: string };
        body[fieldPart.fieldname] = fieldPart.value;
      }
    }

    request.files = files;
    request.body = { ...request.body, ...body };

    return next.handle();
  }
}

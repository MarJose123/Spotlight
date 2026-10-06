/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { FastifyMultipartFile } from '#/common/interceptors/multipart-file.interceptor.js';

/** Extracts all multipart files collected by MultipartFileInterceptor. */
export const UploadedFiles = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): FastifyMultipartFile[] => {
    const request = ctx.switchToHttp().getRequest();
    return request.files ?? [];
  },
);

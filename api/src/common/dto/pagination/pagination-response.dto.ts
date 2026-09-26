/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from './pagination-meta.dto';

/**
 * Envelope returned by every list endpoint.
 *
 * The `data` array is intentionally left undocumented here: OpenAPI cannot
 * express the generic `T`, so `ApiPaginatedResponse` pins it to the concrete
 * item DTO per endpoint (see `@/common/decorators`).
 */
export class PaginationResponseDto<T> {
  data?: T[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.meta = {
      total: total,
      itemCount: data.length,
      perPage: limit,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      hasNextPage: page < total,
      hasPreviousPage: page > 1,
    };
  }
}

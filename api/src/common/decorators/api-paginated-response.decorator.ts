/*
 * SPDX-FileCopyrightText: 2026 Marjose Darang
 * SPDX-License-Identifier: AGPL-3.0
 *
 * Part of Spotlight. Licensed under the GNU Affero General Public License,
 * version 3 only. See the LICENSE file at the repository root for the full terms.
 */
import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginationMetaDto } from '@/common/dto/pagination/pagination-meta.dto';
import { PaginationResponseDto } from '@/common/dto/pagination/pagination-response.dto';

/**
 * Documents a paginated endpoint whose payload is a `PaginationResponseDto<T>`.
 *
 * OpenAPI has no notion of generics, so the shared `PaginationResponseDto`
 * schema only describes `meta`. This decorator composes it through `allOf` and
 * pins the `data` array to the concrete item model, which is what makes the
 * item properties show up in the generated documentation.
 *
 * @param model The DTO class describing a single item in `data`.
 * @param description Optional human readable description of the response.
 */
export const ApiPaginatedResponse = <TModel extends Type<unknown>>(
  model: TModel,
  description = 'Paginated result set',
) =>
  applyDecorators(
    ApiExtraModels(PaginationResponseDto, PaginationMetaDto, model),
    ApiOkResponse({
      description,
      schema: {
        type: 'object',
        allOf: [
          { $ref: getSchemaPath(PaginationResponseDto) },
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
            required: ['data'],
          },
        ],
      },
    }),
  );

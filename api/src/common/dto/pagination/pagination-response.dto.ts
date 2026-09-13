import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationMetaDto } from './pagination-meta.dto';

export class PaginationResponseDto<T> {
  @ApiProperty({ isArray: true, type: Object })
  @Type(() => Object)
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

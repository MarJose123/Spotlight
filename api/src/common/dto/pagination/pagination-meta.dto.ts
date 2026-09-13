import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class PaginationMetaDto {
  @ApiProperty({ type: 'number' })
  @IsNumber()
  total!: number;

  @ApiProperty({ type: 'number' })
  @IsNumber()
  itemCount!: number;

  @ApiProperty({ type: 'number' })
  @IsNumber()
  perPage!: number;

  @ApiProperty({ type: 'number' })
  @IsNumber()
  totalPages!: number;

  @ApiProperty({ type: 'number' })
  @IsNumber()
  currentPage!: number;

  @ApiProperty({ type: 'boolean' })
  hasNextPage!: boolean;

  @ApiProperty({ type: 'boolean' })
  hasPreviousPage!: boolean;
}

import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LikePostDto {
  @ApiProperty({ type: 'string', format: 'uuid', required: true })
  @IsNotEmpty()
  @IsUUID()
  post: string;

  @ApiProperty({ type: 'string', format: 'uuid', required: true })
  @IsNotEmpty()
  @IsUUID()
  user: string;
}

import { Enum } from '@mikro-orm/decorators/legacy';
import { IsNotEmpty } from 'class-validator';
import { AttachmentType } from '@/posts/enums/attachment-type.enum';
import { PostType } from '@/posts/enums/post-type.enum';
import { User } from '@/users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ type: 'string', required: true })
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    type: 'string',
    format: 'enum',
    enum: AttachmentType,
    required: true,
  })
  @Enum({ items: () => AttachmentType })
  @IsNotEmpty()
  attachmentType!: AttachmentType;

  @ApiProperty({ type: 'string', format: 'uri', required: true })
  @IsNotEmpty()
  attachment!: string;

  @ApiProperty({
    type: 'string',
    format: 'enum',
    enum: PostType,
    required: true,
  })
  @Enum({ items: () => PostType, default: PostType.USER })
  @IsNotEmpty()
  postType: PostType = PostType.USER;

  @ApiProperty({ type: 'string', format: 'uuid', required: true })
  @IsNotEmpty()
  user!: User;
}

import { Factory } from '@mikro-orm/seeder';
import { faker } from '@faker-js/faker';
import { Posts } from '@/posts/entities/posts.entity';
import { AttachmentType } from '@/posts/enums/attachment-type.enum';
import { PostType } from '@/posts/enums/post-type.enum';

export class PostsFactory extends Factory<Posts> {
  model = Posts;

  definition(): Partial<Posts> {
    return {
      content: faker.lorem.sentence(),
      attachment: faker.image.url(),
      attachmentType: AttachmentType.IMAGE,
      postType: PostType.USER,
    };
  }
}

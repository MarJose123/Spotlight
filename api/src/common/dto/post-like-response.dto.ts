import { Posts } from '@/posts/entities/posts.entity';

export class PostLikeResponseDto {
  like: boolean;
  post: Posts;

  constructor(like: boolean, post: Posts) {
    this.like = like;
    this.post = post;
  }
}

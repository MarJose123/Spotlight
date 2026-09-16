import {
  Entity,
  Index,
  PrimaryKey,
  Property,
  ManyToOne,
} from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';
import type { Rel } from '@mikro-orm/core';
import { Posts } from '@/posts/entities/posts.entity';
import { User } from '@/users/entities/user.entity';

@Entity()
export class Likes {
  @PrimaryKey({ type: 'uuid' })
  @Index()
  id: string = randomUUID();

  @ManyToOne(() => Posts)
  post!: Rel<Posts>;

  @ManyToOne(() => User)
  user!: Rel<User>;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

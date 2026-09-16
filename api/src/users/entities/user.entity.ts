import {
  Entity,
  Enum,
  Index,
  PrimaryKey,
  Property,
  OneToMany,
} from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';
import { IsOptional } from 'class-validator';
import { UserStatus } from '@/users/enums/status.enum';
import { Exclude } from 'class-transformer';
import { Collection } from '@mikro-orm/core';
import { Posts } from '@/posts/entities/posts.entity';
import { Likes } from '@/posts/entities/likes.entity';

@Entity()
export class User {
  @Index()
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ nullable: true })
  @IsOptional()
  avatar: string | undefined;

  @Property({ unique: true })
  @IsOptional()
  username: string | undefined;

  @Property()
  name!: string;

  @Index()
  @Property({ unique: true })
  email!: string;

  @Property({ hidden: true })
  @Exclude()
  @IsOptional()
  password: string | undefined;

  @Property()
  @Enum({ items: () => UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus = UserStatus.ACTIVE;

  @OneToMany(() => Posts, (posts) => posts.user)
  posts? = new Collection<Posts>(this);

  @OneToMany(() => Likes, (likes) => likes.user)
  likes? = new Collection<Likes>(this);

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

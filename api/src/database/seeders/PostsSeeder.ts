import type { Dictionary, EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { PostsFactory } from '@/database/factories/PostsFactory';
import { faker } from '@faker-js/faker';
import { User } from '@/users/entities/user.entity';

export class PostsSeeder extends Seeder {
  run(em: EntityManager, context: Dictionary<User[]>): void {
    new PostsFactory(em).make(10, {
      user: faker.helpers.arrayElement(context.user),
    });
  }
}

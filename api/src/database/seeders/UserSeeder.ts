import type { Dictionary, EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { UserFactory } from '@/database/factories/UserFactory';

export class UserSeeder extends Seeder {
  run(em: EntityManager, context: Dictionary): void {
    context.user = new UserFactory(em).make(10);
  }
}

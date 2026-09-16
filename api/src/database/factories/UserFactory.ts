import { Factory } from '@mikro-orm/seeder';
import { User } from '@/users/entities/user.entity';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

export class UserFactory extends Factory<User> {
  model = User;

  definition(): Partial<User> {
    return {
      avatar: faker.image.avatar(),
      username: faker.internet.username(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: bcrypt.hashSync('admin123', 10),
    };
  }
}

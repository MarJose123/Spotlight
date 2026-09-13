import {
  Entity,
  Index,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity()
export class RefreshToken {
  @PrimaryKey({ type: 'uuid' })
  @Index()
  id: string = randomUUID();

  @Index()
  @Property()
  userId!: string;

  @Property({ unique: true, length: 64 })
  @Index()
  tokenHash!: string;

  @Property()
  expiresAt!: Date;

  @Property({ nullable: true })
  revokedAt?: Date;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();
}

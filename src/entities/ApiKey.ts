import {
  Entity,
  Property,
  ManyToOne,
  Index,
  PrimaryKey,
} from "@mikro-orm/core";
import { v4 as uuidv4 } from "uuid";
import { User } from "./User";

@Entity()
export class ApiKey {
  @PrimaryKey()
  id: string = uuidv4();

  @Property()
  @Index()
  name!: string;

  @Property({ unique: true })
  @Index()
  key_id!: string;

  @Property()
  secret_hash!: string;

  @Property()
  last_four!: string;

  @ManyToOne(() => User)
  user!: User;

  @Property({ nullable: true })
  revoked_at?: Date;

  @Property({ nullable: true })
  expires_at?: Date;

  @Property({ onCreate: () => new Date() })
  created_at: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updated_at: Date = new Date();
}

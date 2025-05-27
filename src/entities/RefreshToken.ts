import { Entity, PrimaryKey, Property, ManyToOne } from "@mikro-orm/core";
import { User } from "./User";

@Entity({ tableName: "refresh_tokens" })
export class RefreshToken {
  @PrimaryKey()
  id!: number;

  @Property()
  token!: string;

  @ManyToOne(() => User)
  user!: User;

  @Property()
  expires_at!: Date;

  @Property({ default: false })
  is_revoked!: boolean;

  @Property()
  created_at = new Date();
}

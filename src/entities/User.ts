import {
  Entity,
  Property,
  OneToMany,
  Enum,
  Collection,
  PrimaryKey,
} from "@mikro-orm/core";
import { Comment } from "./Comment";
import { v4 as uuidv4 } from "uuid";

export enum Role {
  USER = "USER",
  PARTNER = "PARTNER",
  BOT = "BOT",
  ADMIN = "ADMIN",
}

export interface GoogleUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
  hd?: string;
  profile?: string;
  gender?: string;
}

@Entity()
export class User {
  @PrimaryKey()
  id: string = uuidv4();

  @Property({ unique: true })
  email!: string;

  @Property({ unique: true })
  name!: string;

  @Property({ nullable: true })
  nickname?: string;

  @Property({ unique: true })
  link_id!: string;

  @Enum(() => Role)
  role: Role = Role.USER;

  @Property({ nullable: true })
  profile_url?: string;

  @Property({ nullable: true })
  google_id?: string;

  @OneToMany(() => Comment, (comment) => comment.user)
  comments = new Collection<Comment>(this);

  @Property({ onCreate: () => new Date() })
  created_at: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updated_at: Date = new Date();
}

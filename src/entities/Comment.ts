import {
  Entity,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  PrimaryKey,
  Ref,
  Cascade,
  BeforeCreate,
  Reference,
} from "@mikro-orm/core";
import { v4 } from "uuid";
import { User } from "./User";
import { ReplyComment } from "./ReplyComment";

@Entity()
export class Comment {
  @PrimaryKey()
  id: string = v4();

  @Property()
  message_content!: string;

  @ManyToOne(() => User)
  user!: Ref<User>;

  @Property()
  user_email!: string;

  @OneToMany(() => ReplyComment, (reply) => reply.parent, {
    cascade: [Cascade.REMOVE],
  })
  reply_comments = new Collection<ReplyComment>(this);

  @Property()
  like_by_creator: boolean = false;

  @Property({ onCreate: () => new Date() })
  created_at: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updated_at: Date = new Date();

  @BeforeCreate()
  setUserEmail() {
    if (this.user) {
      this.user_email = Reference.create(this.user).getEntity().email;
    }
  }
}

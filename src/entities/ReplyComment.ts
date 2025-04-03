import { Entity, Property, ManyToOne, PrimaryKey, Ref } from "@mikro-orm/core";
import { v4 } from "uuid";
import { Comment } from "./Comment";

@Entity()
export class ReplyComment {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => Comment)
  parent!: Ref<Comment>;

  @Property()
  message_content!: string;

  @Property({ onCreate: () => new Date() })
  created_at: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updated_at: Date = new Date();
}

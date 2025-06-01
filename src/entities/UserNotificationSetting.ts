import { Entity, PrimaryKey, Property, OneToOne, Ref } from "@mikro-orm/core";
import { User } from "./User";
import { v4 } from "uuid";

@Entity()
export class UserNotificationSetting {
  @PrimaryKey()
  id: string = v4();

  @OneToOne(() => User, { owner: true })
  user!: Ref<User>;

  @Property({ nullable: true })
  fcm_token?: string;

  @Property({ default: true })
  new_message_notifications: boolean = true;

  @Property({ default: "all" })
  notification_frequency: "all" | "important" | "none" = "all";

  @Property()
  created_at: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updated_at: Date = new Date();
}

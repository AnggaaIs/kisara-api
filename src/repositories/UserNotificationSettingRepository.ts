import { BaseRepository } from "./BaseRepository";
import { UserNotificationSetting } from "../entities/UserNotificationSetting";

export class UserNotificationSettingRepository extends BaseRepository<UserNotificationSetting> {
  async findByUserId(userId: string): Promise<UserNotificationSetting | null> {
    return this.findOne({ user: userId });
  }

  async findByUserEmail(
    email: string
  ): Promise<UserNotificationSetting | null> {
    return this.findOneWithPopulate({ user: { email } }, ["user"]);
  }

  async updateFCMToken(
    userId: string,
    fcmToken: string
  ): Promise<UserNotificationSetting | null> {
    const setting = await this.findByUserId(userId);
    if (setting) {
      return this.update(setting.id, { fcm_token: fcmToken });
    }
    return null;
  }

  async createDefaultSetting(
    userId: string,
    fcmToken?: string
  ): Promise<UserNotificationSetting> {
    return this.create({
      user: userId as any,
      fcm_token: fcmToken,
      new_message_notifications: true,
      notification_frequency: "all",
    });
  }
}

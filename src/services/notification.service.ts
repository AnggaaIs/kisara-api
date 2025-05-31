import { FirebaseAdmin } from "../config/firebase";
import { UserNotificationSettingRepository } from "../repositories/UserNotificationSettingRepository";
import { UserRepository } from "../repositories/UserRepository";
import { logger } from "../utils/logger.util";
import { Database } from "../config/database";
import { UserNotificationSetting } from "../entities/UserNotificationSetting";
import { User } from "../entities/User";

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface MessageNotificationData {
  type: "new_message";
  messageId: string;
  senderId: "anonymous";
  senderName: "Seseorang";
  content: string;
  linkId: string;
}

export class NotificationService {
  private readonly userNotificationSettingRepository: UserNotificationSettingRepository;
  private readonly userRepository: UserRepository;

  constructor() {
    this.userNotificationSettingRepository =
      new UserNotificationSettingRepository(
        Database.getORM().em.getRepository(UserNotificationSetting)
      );
    this.userRepository = new UserRepository(
      Database.getORM().em.getRepository(User)
    );
  }

  async sendMessageNotification(
    recipientEmail: string,
    data: MessageNotificationData
  ): Promise<void> {
    try {
      const notificationSetting =
        await this.userNotificationSettingRepository.findByUserEmail(
          recipientEmail
        );

      if (!notificationSetting || !notificationSetting.fcm_token) {
        logger.info(`No FCM token found for user: ${recipientEmail}`);
        return;
      }

      if (
        !notificationSetting.new_message_notifications ||
        notificationSetting.notification_frequency === "none"
      ) {
        logger.info(
          `User ${recipientEmail} has disabled new message notifications`
        );
        return;
      }

      const payload = this.createNotificationPayload(data);
      await this.sendPushNotification(notificationSetting.fcm_token, payload);

      logger.info(`Notification sent successfully to ${recipientEmail}`);
    } catch (error) {
      logger.error(
        { err: error },
        `Failed to send notification to ${recipientEmail}:`,
        error
      );
    }
  }

  private createNotificationPayload(
    data: MessageNotificationData
  ): NotificationPayload {
    return {
      title: "✨ Pesan Misterius Baru!",
      body: `Seseorang mengirim: "${this.truncateText(data.content, 15)}". Tap untuk melihat detail`,
      data: {
        type: data.type,
        messageId: data.messageId,
        senderId: data.senderId,
        senderName: data.senderName,
        linkId: data.linkId,
        clickAction: "FLUTTER_NOTIFICATION_CLICK",
      },
    };
  }

  private async sendPushNotification(
    fcmToken: string,
    payload: NotificationPayload
  ): Promise<void> {
    const messaging = FirebaseAdmin.getMessaging();

    const message = {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      android: {
        notification: {
          channelId: "kisara_messages",
          priority: "high" as const,
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: "default",
          },
        },
      },
    };

    await messaging.send(message);
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  }

  async updateFCMToken(userEmail: string, fcmToken: string): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(userEmail);
      if (!user) {
        throw new Error(`User with email ${userEmail} not found`);
      }

      let setting = await this.userNotificationSettingRepository.findByUserId(
        user.id
      );

      if (!setting) {
        setting =
          await this.userNotificationSettingRepository.createDefaultSetting(
            user.id,
            fcmToken
          );
      } else {
        await this.userNotificationSettingRepository.updateFCMToken(
          user.id,
          fcmToken
        );
      }

      logger.info(`FCM token updated for user: ${userEmail}`);
    } catch (error) {
      logger.error(
        { err: error },
        `Failed to update FCM token for ${userEmail}:`,
        error
      );
      throw error;
    }
  }

  async getUserNotificationSettings(
    userEmail: string
  ): Promise<UserNotificationSetting | null> {
    return this.userNotificationSettingRepository.findByUserEmail(userEmail);
  }

  async updateNotificationSettings(
    userEmail: string,
    settings: Partial<UserNotificationSetting>
  ): Promise<UserNotificationSetting | null> {
    const user = await this.userRepository.findByEmail(userEmail);
    if (!user) {
      throw new Error(`User with email ${userEmail} not found`);
    }

    let notificationSetting =
      await this.userNotificationSettingRepository.findByUserId(user.id);

    if (!notificationSetting) {
      notificationSetting =
        await this.userNotificationSettingRepository.createDefaultSetting(
          user.id,
          settings.fcm_token
        );
    }

    return this.userNotificationSettingRepository.update(
      notificationSetting.id,
      settings
    );
  }
}

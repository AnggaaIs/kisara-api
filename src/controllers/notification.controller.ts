import { FastifyRequest, FastifyReply } from "fastify";
import { NotificationService } from "../services/notification.service";
import { AppResponse, StatusCode } from "../utils/app-response";
import { AppError } from "../middlewares/error.middleware";

export class NotificationController {
  private readonly notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async updateFCMToken(req: FastifyRequest, reply: FastifyReply) {
    const { fcm_token } = req.body as { fcm_token: string };
    const email = req.user?.email;

    if (!email) {
      throw new AppError("User not authenticated", StatusCode.UNAUTHORIZED);
    }

    await this.notificationService.updateFCMToken(email, fcm_token);

    return AppResponse.sendSuccessResponse(
      req,
      reply,
      StatusCode.OK,
      "FCM token updated successfully"
    );
  }

  async getNotificationSettings(req: FastifyRequest, reply: FastifyReply) {
    const email = req.user?.email;

    if (!email) {
      throw new AppError("User not authenticated", StatusCode.UNAUTHORIZED);
    }

    const settings =
      await this.notificationService.getUserNotificationSettings(email);

    return AppResponse.sendSuccessResponse(
      req,
      reply,
      StatusCode.OK,
      "Notification settings retrieved successfully",
      settings
    );
  }

  async updateNotificationSettings(req: FastifyRequest, reply: FastifyReply) {
    const email = req.user?.email;
    const { new_message_notifications, notification_frequency } = req.body as {
      new_message_notifications?: boolean;
      notification_frequency?: "all" | "important" | "none";
    };

    if (!email) {
      throw new AppError("User not authenticated", StatusCode.UNAUTHORIZED);
    }

    const updatedSettings =
      await this.notificationService.updateNotificationSettings(email, {
        new_message_notifications,
        notification_frequency,
      });

    return AppResponse.sendSuccessResponse(
      req,
      reply,
      StatusCode.OK,
      "Notification settings updated successfully",
      updatedSettings
    );
  }
}

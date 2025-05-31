import { FastifyInstance } from "fastify";
import { NotificationController } from "../controllers/notification.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { RateLimitOptions } from "@fastify/rate-limit";

export class NotificationRoutes {
  private rateLimitOptions: RateLimitOptions = {
    max: 20,
    timeWindow: "1 minute",
  };

  constructor(
    private readonly notificationController: NotificationController
  ) {}

  registerRoutes(app: FastifyInstance) {
    app.register(
      (instance, _opts, done) => {
        instance.post(
          "/fcm-token",
          {
            preHandler: authenticate,
            config: { rateLimit: this.rateLimitOptions },
          },
          this.notificationController.updateFCMToken.bind(
            this.notificationController
          )
        );

        instance.get(
          "/settings",
          {
            preHandler: authenticate,
            config: { rateLimit: this.rateLimitOptions },
          },
          this.notificationController.getNotificationSettings.bind(
            this.notificationController
          )
        );

        instance.put(
          "/settings",
          {
            preHandler: authenticate,
            config: { rateLimit: this.rateLimitOptions },
          },
          this.notificationController.updateNotificationSettings.bind(
            this.notificationController
          )
        );

        done();
      },
      { prefix: "/notifications" }
    );
  }
}

import { FastifyInstance } from "fastify";
import { MessageController } from "../controllers/message.controller";
import { MessageBodyPost, MessageBodyGet } from "../models/validation";
import { authenticate } from "../middlewares/auth.middleware";
import { RateLimitOptions } from "@fastify/rate-limit";

export class MessageRoutes {
  private readonly rateLimitOptions: RateLimitOptions = {
    max: 30,
    timeWindow: "1 minute",
  };

  constructor(private readonly messageController: MessageController) {}

  registerRoutes(app: FastifyInstance) {
    app.register(
      (instance, _opts, done) => {
        instance.post<{ Body: typeof MessageBodyPost }>(
          "/:link_id",
          {
            schema: {
              body: MessageBodyPost,
            },
            config: {
              rateLimit: this.rateLimitOptions,
            },
          },
          this.messageController.handleMessagePost.bind(this.messageController)
        );

        instance.get<{ Querystring: typeof MessageBodyGet }>(
          "/:link_id",
          {
            schema: {
              querystring: MessageBodyGet,
            },
            config: {
              rateLimit: this.rateLimitOptions,
            },
          },
          this.messageController.handleMessageGet.bind(this.messageController)
        );

        instance.delete(
          "/:link_id/:message_id",
          {
            preHandler: authenticate,
            config: { rateLimit: this.rateLimitOptions },
          },
          this.messageController.handleDeleteMessage.bind(
            this.messageController
          )
        );

        instance.get<{ Querystring: typeof MessageBodyGet }>(
          "/:link_id/:message_id",
          {
            schema: {
              querystring: MessageBodyGet,
            },
            config: {
              rateLimit: this.rateLimitOptions,
            },
          },
          this.messageController.handleReplyMessageGet.bind(
            this.messageController
          )
        );

        instance.post<{ Body: typeof MessageBodyPost }>(
          "/:link_id/:message_id",
          {
            schema: {
              body: MessageBodyPost,
            },
            preHandler: authenticate,
            config: {
              rateLimit: this.rateLimitOptions,
            },
          },
          this.messageController.handleReplyMessagePost.bind(
            this.messageController
          )
        );

        instance.delete(
          "/:link_id/:message_id/:reply_id",
          {
            preHandler: authenticate,
            config: { rateLimit: this.rateLimitOptions },
          },
          this.messageController.handleDeleteReplyMessage.bind(
            this.messageController
          )
        );

        instance.put(
          "/:link_id/:message_id/like",
          {
            preHandler: authenticate,
            config: { rateLimit: this.rateLimitOptions },
          },
          this.messageController.handleLikeMessage.bind(this.messageController)
        );

        done();
      },
      { prefix: "/message" }
    );
  }
}

import { FastifyInstance } from "fastify";
import { MessageController } from "../controllers/message.controller";
import {
  ApiErrorSchema,
  ApiValidationErrorSchema,
  MessageBodyPost,
  MessageBodyGet,
  buildSuccessNoDataResponseSchema,
  buildSuccessResponseSchema,
} from "../models/validation";
import { authenticate } from "../middlewares/auth.middleware";
import { RateLimitOptions } from "@fastify/rate-limit";
import { Type } from "@sinclair/typebox";

const LinkParams = Type.Object({
  link_id: Type.String(),
});

const LinkMessageParams = Type.Object({
  link_id: Type.String(),
  message_id: Type.String(),
});

const LinkMessageReplyParams = Type.Object({
  link_id: Type.String(),
  message_id: Type.String(),
  reply_id: Type.String(),
});

const CommentCreatedDataSchema = Type.Object({
  id: Type.String(),
  message_content: Type.String(),
  created_at: Type.String({ format: "date-time" }),
});

const MessageListDataSchema = Type.Object({
  page: Type.Integer(),
  limit: Type.Integer(),
  total_records: Type.Integer(),
  total_pages: Type.Integer(),
  author: Type.Object({
    name: Type.String(),
    role: Type.String(),
    profile_url: Type.Union([Type.String(), Type.Null()]),
  }),
  comments: Type.Array(
    Type.Object({
      id: Type.String(),
      message_content: Type.String(),
      like_by_creator: Type.Boolean(),
      created_at: Type.String({ format: "date-time" }),
    })
  ),
});

const ReplyCreatedDataSchema = Type.Object({
  message_id: Type.String(),
  reply_message_id: Type.String(),
  message_content: Type.String(),
  created_at: Type.String({ format: "date-time" }),
});

const ReplyListDataSchema = Type.Object({
  page: Type.Integer(),
  limit: Type.Integer(),
  total_records: Type.Integer(),
  total_pages: Type.Integer(),
  replies: Type.Array(Type.Any()),
});

const LikeDataSchema = Type.Object({
  message_id: Type.String(),
  like_by_creator: Type.Boolean(),
});

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
              tags: ["Message"],
              summary: "Create message",
              params: LinkParams,
              body: MessageBodyPost,
              response: {
                201: buildSuccessResponseSchema(CommentCreatedDataSchema, 201),
                400: ApiValidationErrorSchema,
                404: ApiErrorSchema,
              },
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
              tags: ["Message"],
              summary: "Get messages by link",
              params: LinkParams,
              querystring: MessageBodyGet,
              response: {
                200: buildSuccessResponseSchema(MessageListDataSchema, 200),
                400: ApiValidationErrorSchema,
                404: ApiErrorSchema,
              },
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
            schema: {
              tags: ["Message"],
              summary: "Delete message",
              params: LinkMessageParams,
              security: [{ bearerAuth: [] }],
              response: {
                200: buildSuccessNoDataResponseSchema(200),
                401: ApiErrorSchema,
                404: ApiErrorSchema,
              },
            },
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
              tags: ["Message"],
              summary: "Get replies for message",
              params: LinkMessageParams,
              querystring: MessageBodyGet,
              response: {
                200: buildSuccessResponseSchema(ReplyListDataSchema, 200),
                400: ApiValidationErrorSchema,
                404: ApiErrorSchema,
              },
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
              tags: ["Message"],
              summary: "Reply to message",
              params: LinkMessageParams,
              body: MessageBodyPost,
              security: [{ bearerAuth: [] }],
              response: {
                201: buildSuccessResponseSchema(ReplyCreatedDataSchema, 201),
                400: ApiValidationErrorSchema,
                401: ApiErrorSchema,
                404: ApiErrorSchema,
              },
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
            schema: {
              tags: ["Message"],
              summary: "Delete reply",
              params: LinkMessageReplyParams,
              security: [{ bearerAuth: [] }],
              response: {
                200: buildSuccessResponseSchema(Type.Null(), 200),
                401: ApiErrorSchema,
                404: ApiErrorSchema,
              },
            },
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
            schema: {
              tags: ["Message"],
              summary: "Toggle like by creator",
              params: LinkMessageParams,
              security: [{ bearerAuth: [] }],
              response: {
                200: buildSuccessResponseSchema(LikeDataSchema, 200),
                401: ApiErrorSchema,
                404: ApiErrorSchema,
              },
            },
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

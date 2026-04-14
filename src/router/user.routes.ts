import { FastifyInstance } from "fastify";
import { UserUpdateBody } from "../models/validation";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { RateLimitOptions } from "@fastify/rate-limit";
import {
  ApiErrorSchema,
  buildSuccessResponseSchema,
} from "../models/validation";
import { Type } from "@sinclair/typebox";

const UserProfileDataSchema = Type.Object({
  name: Type.String(),
  link_id: Type.String(),
  profile_url: Type.Union([Type.String(), Type.Null()]),
});

export class UserRoutes {
  private readonly rateLimitOptions: RateLimitOptions = {
    max: 5,
    timeWindow: "1 minute",
  };

  constructor(private readonly userController: UserController) {}

  registerRoutes(app: FastifyInstance) {
    app.register(
      (instance, _opts, done) => {
        instance.get(
          "/",
          {
            schema: {
              tags: ["User"],
              summary: "Get current user profile",
              security: [{ bearerAuth: [] }],
              response: {
                200: buildSuccessResponseSchema(UserProfileDataSchema, 200),
                401: ApiErrorSchema,
                404: ApiErrorSchema,
              },
            },
            preHandler: authenticate,
            config: {
              rateLimit: this.rateLimitOptions,
            },
          },
          this.userController.handleGetUser.bind(this.userController)
        );

        // instance.put<{ Body: typeof UserUpdateBody }>(
        //   "/",
        //   {
        //     schema: {
        //       body: UserUpdateBody,
        //     },
        //     config: {
        //       rateLimit: this.rateLimitOptions,
        //     },
        //     preHandler: authenticate,
        //   },
        //   this.userController.handleUpdateUser.bind(this.userController)
        // );

        done();
      },
      { prefix: "/user" }
    );
  }
}

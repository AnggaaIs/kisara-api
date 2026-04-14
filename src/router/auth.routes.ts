import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller";
import {
  ApiErrorSchema,
  ApiValidationErrorSchema,
  AuthGoogleCallbackBody,
  AuthRefreshTokenBody,
  buildSuccessResponseSchema,
} from "../models/validation";
import { RateLimitOptions } from "@fastify/rate-limit";
import { Type } from "@sinclair/typebox";

const GoogleAuthUrlDataSchema = Type.Object({
  url: Type.String(),
});

const AuthTokenDataSchema = Type.Object({
  access_token: Type.String(),
  refresh_token: Type.String(),
});

export class AuthRoutes {
  private readonly rateLimitOptions: RateLimitOptions = {
    max: 10,
    timeWindow: "1 minute",
  };

  constructor(private readonly authController: AuthController) {}

  registerRoutes(app: FastifyInstance) {
    app.register(
      (instance, _opts, done) => {
        instance.get(
          "/google/url",
          {
            schema: {
              tags: ["Auth"],
              summary: "Generate Google OAuth URL",
              description:
                "Returns Google OAuth consent URL that will be used by frontend login flow.",
              response: {
                200: buildSuccessResponseSchema(GoogleAuthUrlDataSchema, 200),
                500: ApiErrorSchema,
              },
            },
            config: {
              rateLimit: this.rateLimitOptions,
            },
          },
          this.authController.handleGoogleURL.bind(this.authController)
        );

        instance.post<{ Body: typeof AuthGoogleCallbackBody }>(
          "/google/callback",
          {
            schema: {
              tags: ["Auth"],
              summary: "Google OAuth callback",
              description:
                "Exchange authorization code with Google and issue API access/refresh tokens.",
              body: AuthGoogleCallbackBody,
              response: {
                200: buildSuccessResponseSchema(AuthTokenDataSchema, 200),
                400: ApiValidationErrorSchema,
                500: ApiErrorSchema,
              },
            },
            config: {
              rateLimit: this.rateLimitOptions,
            },
          },
          this.authController.handleGoogleCallback.bind(this.authController)
        );

        instance.post<{ Body: typeof AuthRefreshTokenBody }>(
          "/refresh",
          {
            schema: {
              tags: ["Auth"],
              summary: "Refresh JWT token",
              description:
                "Validate refresh token and return newly generated access/refresh token pair.",
              body: AuthRefreshTokenBody,
              response: {
                200: buildSuccessResponseSchema(AuthTokenDataSchema, 200),
                400: ApiValidationErrorSchema,
                401: ApiErrorSchema,
              },
            },
            config: {
              rateLimit: this.rateLimitOptions,
            },
          },
          this.authController.refreshToken.bind(this.authController)
        );

        done();
      },
      { prefix: "/auth" }
    );
  }
}

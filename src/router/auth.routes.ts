import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller";
import {
  ApiErrorSchema,
  ApiValidationErrorSchema,
  AuthGoogleCallbackBody,
  AuthRefreshTokenBody,
  ApiKeyCreateBody,
  buildSuccessNoDataResponseSchema,
  buildSuccessResponseSchema,
} from "../models/validation";
import { RateLimitOptions } from "@fastify/rate-limit";
import { Type } from "@sinclair/typebox";
import { authenticateJwt } from "../middlewares/auth.middleware";

const GoogleAuthUrlDataSchema = Type.Object({
  url: Type.String(),
});

const GoogleCallbackQuerySchema = Type.Object({
  code: Type.String({ minLength: 1, maxLength: 512 }),
  state: Type.Optional(Type.String({ minLength: 1, maxLength: 150 })),
});

const AuthTokenDataSchema = Type.Object({
  access_token: Type.String(),
});

const ApiKeyItemSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  key_id: Type.String(),
  last_four: Type.String(),
  created_at: Type.String({ format: "date-time" }),
  updated_at: Type.String({ format: "date-time" }),
  revoked_at: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
  expires_at: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
});

const ApiKeyCreatedDataSchema = Type.Object({
  api_key: Type.String(),
  key: Type.Object({
    name: Type.String(),
    key_id: Type.String(),
    last_four: Type.String(),
    key_type: Type.Union([Type.Literal("live"), Type.Literal("dev")]),
  }),
});

const ApiKeyListDataSchema = Type.Object({
  items: Type.Array(ApiKeyItemSchema),
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
              tags: ["Auth (Internal Web Session)"],
              summary: "Generate Google OAuth URL",
              description:
                "Internal frontend login flow: returns Google OAuth consent URL.",
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
              tags: ["Auth (Internal Web Session)"],
              summary: "Google OAuth callback",
              description:
                "Internal frontend login flow: exchange authorization code and issue JWT web-session tokens.",
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

        instance.get<{ Querystring: typeof GoogleCallbackQuerySchema }>(
          "/google/callback",
          {
            schema: {
              tags: ["Auth (Internal Web Session)"],
              summary: "Google OAuth callback redirect",
              description:
                "Google redirect handler for web login: exchanges authorization code, sets auth cookies, and redirects to frontend dashboard.",
              querystring: GoogleCallbackQuerySchema,
              response: {
                302: Type.Object({}),
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
              tags: ["Auth (Internal Web Session)"],
              summary: "Refresh JWT token",
              description:
                "Internal web-session flow: validate refresh token and issue new JWT pair.",
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

        instance.post<{ Body: { name: string } }>(
          "/api-keys",
          {
            schema: {
              tags: ["API Keys"],
              summary: "Generate API key",
              description:
                "Create a new API key for consumer API access. Requires authenticated web session.",
              security: [{ bearerAuth: [] }],
              body: ApiKeyCreateBody,
              response: {
                201: buildSuccessResponseSchema(ApiKeyCreatedDataSchema, 201),
                401: ApiErrorSchema,
              },
            },
            preHandler: authenticateJwt,
            config: {
              rateLimit: this.rateLimitOptions,
            },
          },
          this.authController.generateApiKey.bind(this.authController)
        );

        instance.get(
          "/api-keys",
          {
            schema: {
              tags: ["API Keys"],
              summary: "List API keys",
              description:
                "Returns all API keys owned by the authenticated user.",
              security: [{ bearerAuth: [] }],
              response: {
                200: buildSuccessResponseSchema(ApiKeyListDataSchema, 200),
                401: ApiErrorSchema,
              },
            },
            preHandler: authenticateJwt,
            config: {
              rateLimit: this.rateLimitOptions,
            },
          },
          this.authController.listApiKeys.bind(this.authController)
        );

        instance.delete<{ Params: { api_key_id: string } }>(
          "/api-keys/:api_key_id",
          {
            schema: {
              tags: ["API Keys"],
              summary: "Revoke API key",
              description: "Revoke an API key owned by the authenticated user.",
              security: [{ bearerAuth: [] }],
              params: Type.Object({
                api_key_id: Type.String(),
              }),
              response: {
                200: buildSuccessNoDataResponseSchema(200),
                401: ApiErrorSchema,
                404: ApiErrorSchema,
              },
            },
            preHandler: authenticateJwt,
            config: {
              rateLimit: this.rateLimitOptions,
            },
          },
          this.authController.revokeApiKey.bind(this.authController)
        );

        done();
      },
      { prefix: "/auth" }
    );
  }
}

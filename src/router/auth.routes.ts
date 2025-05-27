import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller";
import {
  AuthGoogleCallbackBody,
  AuthGoogleMobileBody,
  RefreshTokenBody,
} from "../models/validation";
import { RateLimitOptions } from "@fastify/rate-limit";

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
              body: AuthGoogleCallbackBody,
            },
            config: {
              rateLimit: this.rateLimitOptions,
            },
          },
          this.authController.handleGoogleCallback.bind(this.authController)
        );

        instance.post<{ Body: typeof AuthGoogleMobileBody }>(
          "/google/mobile",
          {
            schema: {
              body: AuthGoogleMobileBody,
            },
            config: {
              rateLimit: this.rateLimitOptions,
            },
          },
          this.authController.handleGoogleMobileLogin.bind(this.authController)
        );

        instance.post<{ Body: typeof RefreshTokenBody }>(
          "/google/refresh",
          {
            schema: {
              body: RefreshTokenBody,
            },
            config: {
              rateLimit: this.rateLimitOptions,
            },
          },
          this.authController.handleRefreshToken.bind(this.authController)
        );

        instance.post<{ Body: typeof RefreshTokenBody }>(
          "/google/logout",
          {
            schema: {
              body: RefreshTokenBody,
            },
            config: {
              rateLimit: this.rateLimitOptions,
            },
          },
          this.authController.handleLogout.bind(this.authController)
        );

        done();
      },
      { prefix: "/auth" }
    );
  }
}

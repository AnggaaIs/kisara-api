import { FastifyReply, FastifyRequest } from "fastify";
import { UserRepository } from "../repositories/UserRepository";
import { Role, User } from "../entities/User";
import { Database } from "../config/database";
import { OAuth2Client } from "google-auth-library";
import { environment } from "../config/environment";
import { AppError } from "../middlewares/error.middleware";
import { AppResponse, StatusCode } from "../utils/app-response";
import logger from "../utils/logger.util";
import { GenerateUtil } from "../utils/generate.util";
import { AuthService } from "../services/auth.service";
import { UserService } from "../services/user.service";
import { ApiKeyRepository } from "../repositories/ApiKeyRepository";
import { ApiKey } from "../entities/ApiKey";
import { ApiKeyService } from "../services/api-key.service";

export class AuthController {
  private readonly userRepository: UserRepository;
  private readonly userService: UserService;
  private readonly authService: AuthService;
  private readonly apiKeyRepository: ApiKeyRepository;
  private readonly apiKeyService: ApiKeyService;
  private readonly oauth2Client: OAuth2Client;

  constructor() {
    this.userRepository = new UserRepository(
      Database.getORM().em.getRepository(User)
    );
    this.userService = new UserService(this.userRepository);
    this.authService = new AuthService(this.userService);
    this.apiKeyRepository = new ApiKeyRepository(
      Database.getORM().em.getRepository(ApiKey)
    );
    this.apiKeyService = new ApiKeyService(
      this.userService,
      this.apiKeyRepository
    );
    this.oauth2Client = new OAuth2Client(
      environment.google.clientId,
      environment.google.clientSecret,
      environment.google.redirectUri
    );
  }

  private buildCookieValue(name: string, value: string, maxAge: number) {
    const securePart = environment.nodeEnv === "production" ? " Secure;" : "";

    return `${name}=${value}; HttpOnly;${securePart} SameSite=Strict; Max-Age=${maxAge}; Path=/`;
  }

  private extractCode(request: FastifyRequest) {
    const body = request.body as { code?: string } | undefined;
    const query = request.query as { code?: string } | undefined;

    return body?.code || query?.code;
  }

  async handleGoogleURL(request: FastifyRequest, reply: FastifyReply) {
    try {
      const state = Math.random().toString(36).substring(2, 15);
      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["profile", "email"],
        state,
      });

      return AppResponse.sendSuccessResponse(
        request,
        reply,
        StatusCode.OK,
        "Google URL generated successfully",
        { url: authUrl }
      );
    } catch (error) {
      logger.error({ err: error }, "Error generating Google URL: ", error);
      throw new AppError("Failed to generate Google URL", 500);
    }
  }

  async handleGoogleCallback(request: FastifyRequest, reply: FastifyReply) {
    try {
      const code = this.extractCode(request);

      if (!code) {
        throw new AppError("Authorization code is required", 400);
      }

      if (request.method === "GET") {
        const query = request.query as { state?: string } | undefined;
        const callbackUrl = new URL(
          `${environment.urls.web}/auth/google/callback`
        );

        callbackUrl.searchParams.set("code", code);
        if (query?.state) {
          callbackUrl.searchParams.set("state", query.state);
        }

        return reply.redirect(callbackUrl.toString(), 302);
      }

      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      const response = await this.oauth2Client.request({
        url: "https://www.googleapis.com/oauth2/v3/userinfo",
      });
      const userInfo = response.data as {
        email: string;
        sub: string;
        name: string;
        picture: string;
      };

      let user = await this.userRepository.findOne({
        email: userInfo.email,
      });

      if (!user) {
        const linkId = await GenerateUtil.generateUniqueLinkID(
          Database.getORM().em,
          7
        );

        user = await this.userRepository.create({
          email: userInfo.email,
          name: userInfo.name,
          profile_url: userInfo.picture,
          link_id: linkId,
          role: Role.USER,
        });
      } else {
        const updatedUser = await this.userRepository.update(user.id, {
          name: userInfo.name,
          profile_url: userInfo.picture,
        });
        if (updatedUser) {
          user = updatedUser;
        }
      }

      const { accessToken, refreshToken } =
        this.authService.generateTokens(user);

      await this.userRepository.update(user.id, {
        refresh_token: refreshToken,
      });

      const refreshCookie = this.buildCookieValue(
        "refresh_token",
        refreshToken,
        environment.jwt.refreshExpiresIn
      );

      if (environment.nodeEnv === "production") {
        reply.header("Set-Cookie", refreshCookie);

        return AppResponse.sendSuccessResponse(
          request,
          reply,
          StatusCode.OK,
          "Google login successful",
          { access_token: accessToken }
        );
      }

      return AppResponse.sendSuccessResponse(
        request,
        reply,
        StatusCode.OK,
        "Google login successful",
        { access_token: accessToken, refresh_token: refreshToken }
      );
    } catch (error) {
      logger.error({ err: error }, "Error during Google callback: ", error);
      throw new AppError("Failed to process Google callback", 500);
    }
  }

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { refresh_token } = request.body as { refresh_token: string };

      if (!refresh_token) {
        throw new AppError("Refresh token is required", 400);
      }

      const user = await this.authService.verifyRefreshToken(refresh_token);
      const tokens = this.authService.generateTokens(user);

      await this.userRepository.update(user.id, {
        refresh_token: tokens.refreshToken,
      });

      const cookieValue = this.buildCookieValue(
        "refresh_token",
        tokens.refreshToken,
        environment.jwt.refreshExpiresIn
      );
      reply.header("Set-Cookie", cookieValue);

      return AppResponse.sendSuccessResponse(
        request,
        reply,
        StatusCode.OK,
        "Token refreshed successfully",
        { access_token: tokens.accessToken }
      );
    } catch (error) {
      logger.error({ err: error }, "Error refreshing token: ", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to refresh token", 401);
    }
  }

  async generateApiKey(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { name } = request.body as { name: string };
      const email = request.user?.email;

      if (!email) {
        throw new AppError("Unauthorized", 401);
      }

      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      const apiKeyMaterial = await this.apiKeyService.createForUser(user, name);

      return AppResponse.sendSuccessResponse(
        request,
        reply,
        StatusCode.CREATED,
        "API key generated successfully",
        {
          api_key: apiKeyMaterial.apiKey,
          key: {
            name,
            key_id: apiKeyMaterial.keyId,
            last_four: apiKeyMaterial.lastFour,
            key_type: apiKeyMaterial.keyType,
          },
        }
      );
    } catch (error) {
      logger.error({ err: error }, "Error generating API key: ", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to generate API key", 500);
    }
  }

  async listApiKeys(request: FastifyRequest, reply: FastifyReply) {
    try {
      const email = request.user?.email;

      if (!email) {
        throw new AppError("Unauthorized", 401);
      }

      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      const keys = await this.apiKeyService.listForUser(user.id);

      return AppResponse.sendSuccessResponse(
        request,
        reply,
        StatusCode.OK,
        "API keys retrieved successfully",
        { items: keys }
      );
    } catch (error) {
      logger.error({ err: error }, "Error listing API keys: ", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to list API keys", 500);
    }
  }

  async revokeApiKey(request: FastifyRequest, reply: FastifyReply) {
    try {
      const email = request.user?.email;
      const { api_key_id } = request.params as { api_key_id: string };

      if (!email) {
        throw new AppError("Unauthorized", 401);
      }

      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      await this.apiKeyService.revokeForUser(user.id, api_key_id);

      return AppResponse.sendSuccessNoDataResponse(
        request,
        reply,
        StatusCode.OK,
        "API key revoked successfully"
      );
    } catch (error) {
      logger.error({ err: error }, "Error revoking API key: ", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to revoke API key", 500);
    }
  }
}

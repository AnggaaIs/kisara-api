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
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { RefreshTokenRepository } from "../repositories/RefreshTokenRepository";
import { RefreshToken } from "../entities/RefreshToken";

export class AuthController {
  private readonly userRepository: UserRepository;
  private readonly oauth2Client: OAuth2Client;
  private readonly refreshTokenRepository: RefreshTokenRepository;

  constructor() {
    this.userRepository = new UserRepository(
      Database.getORM().em.getRepository(User)
    );
    this.refreshTokenRepository = new RefreshTokenRepository(
      Database.getORM().em.getRepository(RefreshToken)
    );
    this.oauth2Client = new OAuth2Client(
      environment.google.clientId,
      environment.google.clientSecret,
      environment.google.redirectUri
    );
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
      const { code } = request.body as { code: string };
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

      const token = jwt.sign(
        {
          email: userInfo.email,
          role: Role.USER,
        },
        environment.jwt.secret,
        { expiresIn: "15m" }
      );

      const existingUser = await this.userRepository.findOne({
        email: userInfo.email,
      });

      if (!existingUser) {
        const linkId = await GenerateUtil.generateUniqueLinkID(
          Database.getORM().em,
          7
        );

        await this.userRepository.create({
          email: userInfo.email,
          name: userInfo.name,
          profile_url: userInfo.picture,
          link_id: linkId,
          role: Role.USER,
        });
      } else {
        await this.userRepository.update(existingUser.id, {
          name: userInfo.name,
          profile_url: userInfo.picture,
        });
      }

      return AppResponse.sendSuccessResponse(
        request,
        reply,
        StatusCode.OK,
        "Google login successful",
        { access_token: token }
      );
    } catch (error) {
      logger.error({ err: error }, "Error during Google callback: ", error);
      throw new AppError("Failed to process Google callback", 500);
    }
  }

  async handleGoogleMobileLogin(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id_token } = request.body as { id_token: string };

      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: id_token,
        audience: environment.google.clientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new AppError("Invalid Google token", 400);
      }

      const { email, sub, name, picture } = payload;

      if (!email) {
        throw new AppError("Email not found in Google token", 400);
      }

      const existingUser = await this.userRepository.findOne({
        email,
      });

      let user;

      if (!existingUser) {
        const linkId = await GenerateUtil.generateUniqueLinkID(
          Database.getORM().em,
          7
        );

        user = await this.userRepository.create({
          email,
          name: name || "Unknown",
          profile_url: picture || "",
          link_id: linkId,
          role: Role.USER,
        });

        logger.info(`New user created: ${email}`);
      } else {
        user = await this.userRepository.update(existingUser.id, {
          name: name || existingUser.name,
          profile_url: picture || existingUser.profile_url,
        });

        logger.info(`User updated: ${email}`);
      }

      const accessToken = jwt.sign(
        {
          email: user!.email,
          role: user!.role,
        },
        environment.jwt.secret,
        { expiresIn: "15m" }
      );

      const refreshToken = crypto.randomBytes(64).toString("hex");
      const refreshExpiry = new Date();
      refreshExpiry.setFullYear(refreshExpiry.getFullYear() + 1);

      await this.refreshTokenRepository.create({
        token: refreshToken,
        user: user!,
        expires_at: refreshExpiry,
      });

      return AppResponse.sendSuccessResponse(
        request,
        reply,
        StatusCode.OK,
        "Google mobile login successful",
        {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 900,
          user: {
            id: user!.id,
            email: user!.email,
            name: user!.name,
            profile_url: user!.profile_url,
            link_id: user!.link_id,
            role: user!.role,
          },
        }
      );
    } catch (error) {
      logger.error({ err: error }, "Error during Google mobile login: ", error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Failed to process Google mobile login", 500);
    }
  }

  async handleRefreshToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { refresh_token } = request.body as { refresh_token: string };

      const tokenRecord =
        await this.refreshTokenRepository.findValidTokenWithUser(refresh_token);

      if (!tokenRecord || tokenRecord.expires_at < new Date()) {
        throw new AppError("Invalid or expired refresh token", 401);
      }

      const accessToken = jwt.sign(
        {
          email: tokenRecord.user.email,
          role: tokenRecord.user.role,
        },
        environment.jwt.secret,
        { expiresIn: "15m" }
      );

      return AppResponse.sendSuccessResponse(
        request,
        reply,
        StatusCode.OK,
        "Token refreshed successfully",
        {
          access_token: accessToken,
          expires_in: 900,
        }
      );
    } catch (error) {
      logger.error({ err: error }, "Error refreshing token: ", error);
      throw new AppError("Failed to refresh token", 401);
    }
  }

  async handleLogout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { refresh_token } = request.body as { refresh_token: string };

      await this.refreshTokenRepository.revokeToken(refresh_token);

      return AppResponse.sendSuccessResponse(
        request,
        reply,
        StatusCode.OK,
        "Logout successful",
        null
      );
    } catch (error) {
      logger.error({ err: error }, "Error during logout: ", error);
      throw new AppError("Failed to logout", 500);
    }
  }
}

import { FastifyReply, FastifyRequest } from "fastify";
import { UserRepository } from "../repositories/UserRepository";
import { User } from "../entities/User";
import { Database } from "../config/database";
import { OAuth2Client } from "google-auth-library";
import { environment } from "../config/environment";
import { JwtUtil } from "../utils/jwt.util";
import { AppError } from "../middlewares/error.middleware";
import { AppResponse, StatusCode } from "../utils/app-response";
import logger from "../utils/logger.util";

export class AuthController {
  private readonly userRepository: UserRepository;
  private readonly oauth2Client: OAuth2Client;

  constructor() {
    this.userRepository = new UserRepository(
      Database.getORM().em.getRepository(User)
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

      const token = JwtUtil.generateToken({
        email: userInfo.email,
        sub: userInfo.sub,
        name: userInfo.name,
        picture: userInfo.picture,
      });

      const existingUser = await this.userRepository.findOne({
        email: userInfo.email,
      });

      if (!existingUser) {
        await this.userRepository.create({
          email: userInfo.email,
          name: userInfo.name,
          profile_url: userInfo.picture,
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
}

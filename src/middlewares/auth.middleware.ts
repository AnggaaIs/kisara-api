import { FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "./error.middleware";
import { AuthService } from "../services/auth.service";
import { UserService } from "../services/user.service";
import { UserRepository } from "../repositories/UserRepository";
import { Database } from "../config/database";
import { User } from "../entities/User";

export interface AuthUser {
  email: string;
  role: string;
  id: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

let authServiceInstance: AuthService | null = null;

function getAuthService(): AuthService {
  if (!authServiceInstance) {
    const userRepository = new UserRepository(
      Database.getORM().em.getRepository(User)
    );
    const userService = new UserService(userRepository);
    authServiceInstance = new AuthService(userService);
  }
  return authServiceInstance;
}

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorized: No token provided", 401);
    }

    const token = authHeader.split(" ")[1];

    const authService = getAuthService();

    const user = await authService.validateToken(token);

    request.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Unauthorized: Invalid token", 401);
  }
};

export const authorizeRoles = (roles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new AppError("Unauthorized: Authentication Required", 401);
    }

    if (!roles.includes(request.user.role)) {
      throw new AppError("Forbidden: Insufficient permissions", 403);
    }
  };
};

import { FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "./error.middleware";
import { AuthService } from "../services/auth.service";
import { UserService } from "../services/user.service";
import { UserRepository } from "../repositories/UserRepository";
import { Database } from "../config/database";
import { User } from "../entities/User";
import { ApiKeyRepository } from "../repositories/ApiKeyRepository";
import { ApiKeyService } from "../services/api-key.service";
import { ApiKey } from "../entities/ApiKey";

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
let apiKeyServiceInstance: ApiKeyService | null = null;

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

function getApiKeyService(): ApiKeyService {
  if (!apiKeyServiceInstance) {
    const userRepository = new UserRepository(
      Database.getORM().em.getRepository(User)
    );
    const userService = new UserService(userRepository);
    const apiKeyRepository = new ApiKeyRepository(
      Database.getORM().em.getRepository(ApiKey)
    );
    apiKeyServiceInstance = new ApiKeyService(userService, apiKeyRepository);
  }
  return apiKeyServiceInstance;
}

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      const authService = getAuthService();

      const user = await authService.validateToken(token);

      request.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      return;
    }

    const apiKeyHeader = request.headers["x-api-key"];

    if (typeof apiKeyHeader === "string" && apiKeyHeader.trim()) {
      const apiKeyService = getApiKeyService();
      const user = await apiKeyService.verifyApiKey(apiKeyHeader.trim());

      request.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      return;
    }

    throw new AppError("Unauthorized: No credentials provided", 401);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Unauthorized: Invalid credentials", 401);
  }
};

export const authenticateJwt = async (
  request: FastifyRequest,
  _reply: FastifyReply
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

import { FastifyRequest, FastifyReply } from "fastify";
import { JwtUtil } from "../utils/jwt.util";
import { AppError } from "./error.middleware";

export interface AuthUser {
  email: string;
  role: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
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
    const decoded = JwtUtil.verifyToken(token);

    request.user = {
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
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

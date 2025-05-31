import { UserService } from "./user.service";
import { AppError } from "../middlewares/error.middleware";
import { User } from "../entities/User";
import jsonwebtoken from "jsonwebtoken";

export interface LoginResponse {
  user: Partial<User>;
  token: string;
}

export class AuthService {
  constructor(private readonly userService: UserService) {}

  async validateToken(token: string): Promise<User> {
    try {
      const decoded = jsonwebtoken.verify(
        token,
        process.env.JWT_SECRET as string
      ) as { email: string; role: string };

      if (!decoded || !decoded.email) {
        throw new AppError("Invalid token payload", 401);
      }
      const user = await this.userService.findByEmail(decoded.email);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      return user;
    } catch (error) {
      if (error instanceof jsonwebtoken.TokenExpiredError) {
        throw new AppError("Token has expired", 401);
      } else if (error instanceof jsonwebtoken.JsonWebTokenError) {
        throw new AppError("Invalid token", 401);
      } else if (error instanceof jsonwebtoken.NotBeforeError) {
        throw new AppError("Token not active", 401);
      } else {
        throw new AppError("Authentication failed", 401);
      }
    }
  }

  isTokenValid(token: string): boolean {
    try {
      jsonwebtoken.verify(token, process.env.JWT_SECRET as string);
      return true;
    } catch {
      return false;
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      jsonwebtoken.verify(token, process.env.JWT_SECRET as string);
      return false;
    } catch (error) {
      return error instanceof jsonwebtoken.TokenExpiredError;
    }
  }
}

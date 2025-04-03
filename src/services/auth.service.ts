import { UserService } from "./user.service";
import { JwtUtil } from "../utils/jwt.util";
import { AppError } from "../middlewares/error.middleware";
import { User } from "../entities/User";

export interface LoginResponse {
  user: Partial<User>;
  token: string;
}

export class AuthService {
  constructor(private readonly userService: UserService) {}

  async validateToken(token: string): Promise<User> {
    try {
      const decoded = JwtUtil.verifyToken(token);
      const user = await this.userService.findByEmail(decoded.email);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      return user;
    } catch (error) {
      throw new AppError("Invalid token", 401);
    }
  }
}

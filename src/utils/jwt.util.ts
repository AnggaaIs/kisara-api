import jwt from "jsonwebtoken";
import { environment } from "../config/environment";

export interface JwtPayload {
  email: string;
  role: string;
}

export class JwtUtil {
  static generateToken(payload: JwtPayload | any): string {
    return jwt.sign(payload, environment.jwt.secret as jwt.Secret, {
      expiresIn: environment.jwt.expiresIn as number,
    });
  }

  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, environment.jwt.secret) as JwtPayload;
  }
}

import { Role, User } from "../entities/User";
import { Database } from "../config/database";
import crypto from "crypto";
import { GenerateUtil } from "../utils/generate.util";
import { UserRepository } from "../repositories/UserRepository";
import { UserService } from "./user.service";
import { AuthService } from "./auth.service";

export class DummyDataCreator {
  private static generateRandomEmail(): string {
    const randomString = crypto.randomBytes(5).toString("hex");
    return `${randomString}@lazypeople.org`;
  }

  static async createDummyUser(): Promise<{
    email: string;
    access_token: string;
    refresh_token: string;
  }> {
    const orm = Database.getORM();
    const userRepository = new UserRepository(orm.em.getRepository(User));
    const userService = new UserService(userRepository);
    const authService = new AuthService(userService);
    const linkId = await GenerateUtil.generateUniqueLinkID(orm.em, 7);

    const user = new User();
    user.email = this.generateRandomEmail();
    user.name = "Angga";
    user.link_id = linkId;
    user.role = Role.USER;
    user.profile_url = "https://example.com/profile/angga";
    user.nickname = "AnggaNet - " + linkId;

    await userRepository.save(user);

    const { accessToken, refreshToken } = authService.generateTokens(user);
    await userRepository.update(user.id, { refresh_token: refreshToken });

    console.log(`Dummy user created with email: ${user.email}`);
    console.log(`Generated Access Token: ${accessToken}`);
    console.log(`Generated Refresh Token: ${refreshToken}`);

    return {
      email: user.email,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}

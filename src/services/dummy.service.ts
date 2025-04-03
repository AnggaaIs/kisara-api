import { Role, User } from "../entities/User";
import { Database } from "../config/database";
import crypto from "crypto";
import { JwtUtil } from "../utils/jwt.util";
import { GenerateUtil } from "../utils/generate.util";

export class DummyDataCreator {
  private static generateRandomEmail(): string {
    const randomString = crypto.randomBytes(5).toString("hex");
    return `${randomString}@lazypeople.org`;
  }

  private static generateRandomToken(
    userEmail: string,
    userSub: string,
    userName: string,
    userPicture: string
  ): string {
    return JwtUtil.generateToken({
      email: userEmail,
      sub: userSub,
      name: userName,
      picture: userPicture,
    });
  }

  static async createDummyUser() {
    const orm = Database.getORM();
    const userRepository = orm.em.getRepository(User);
    const linkId = await GenerateUtil.generateUniqueLinkID(orm.em, 7);

    const user = new User();
    user.email = this.generateRandomEmail();
    user.name = "Angga";
    user.link_id = linkId;
    user.role = Role.USER;
    user.profile_url = "https://example.com/profile/angga";
    user.nickname = "AnggaNet - " + linkId;

    await userRepository.getEntityManager().persistAndFlush(user);

    const token = this.generateRandomToken(
      user.email,
      user.link_id,
      user.name,
      user.profile_url
    );

    console.log(`Dummy user created with email: ${user.email}`);
    console.log(`Generated Token: ${token}`);
  }
}

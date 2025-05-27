import { EntityRepository } from "@mikro-orm/postgresql";
import { RefreshToken } from "../entities/RefreshToken";
import { BaseRepository } from "./BaseRepository";

export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  constructor(repository: EntityRepository<RefreshToken>) {
    super(repository);
  }

  async revokeToken(token: string): Promise<void> {
    const refreshToken = await this.repository.findOne({ token });
    if (refreshToken) {
      refreshToken.is_revoked = true;
      await this.repository.getEntityManager().flush();
    }
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    const qb = this.repository.createQueryBuilder("rt");
    const tokens = await qb.where({ user: userId }).getResult();

    tokens.forEach((token) => {
      token.is_revoked = true;
    });
    await this.repository.getEntityManager().flush();
  }

  async findValidToken(token: string): Promise<RefreshToken | null> {
    return this.repository.findOne({
      token,
      is_revoked: false,
    });
  }

  async cleanupExpiredTokens(): Promise<number> {
    const expiredTokens = await this.repository.find({
      expires_at: { $lt: new Date() },
    });

    if (expiredTokens.length > 0) {
      await this.repository.getEntityManager().removeAndFlush(expiredTokens);
    }

    return expiredTokens.length;
  }

  async revokeAllUserTokensWithQB(userId: number): Promise<void> {
    const qb = this.repository.createQueryBuilder("rt");
    await qb
      .update({ is_revoked: true })
      .where("rt.user_id = ?", [userId])
      .execute();
  }

  async revokeAllUserTokensByUserId(userId: number): Promise<void> {
    const em = this.repository.getEntityManager();

    const qb = em.createQueryBuilder(RefreshToken, "rt");
    await qb.update({ is_revoked: true }).where({ user: userId }).execute();
  }

  async findValidTokenWithUser(token: string): Promise<RefreshToken | null> {
    return this.repository.findOne(
      {
        token,
        is_revoked: false,
      },
      { populate: ["user"] }
    );
  }
}

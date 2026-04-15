import { EntityRepository } from "@mikro-orm/postgresql";
import { ApiKey } from "../entities/ApiKey";
import { BaseRepository } from "./BaseRepository";

export class ApiKeyRepository extends BaseRepository<ApiKey> {
  constructor(repository: EntityRepository<ApiKey>) {
    super(repository);
  }

  async findByKeyId(keyId: string): Promise<ApiKey | null> {
    return this.repository.findOne({ key_id: keyId }, { populate: ["user"] });
  }

  async findByUserId(userId: string): Promise<ApiKey[]> {
    return this.repository.find({ user: userId } as any, {
      orderBy: { created_at: "desc" },
    });
  }

  async findByUserAndId(
    userId: string,
    apiKeyId: string
  ): Promise<ApiKey | null> {
    return this.repository.findOne({ id: apiKeyId, user: userId } as any, {
      populate: ["user"],
    });
  }
}

import { User } from "../entities/User";
import { BaseRepository } from "./BaseRepository";
import { EntityRepository } from "@mikro-orm/postgresql";

export class UserRepository extends BaseRepository<User> {
  constructor(repository: EntityRepository<User>) {
    super(repository);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ email });
  }

  async findByLinkId(linkId: string): Promise<User | null> {
    return this.repository.findOne({ link_id: linkId });
  }

  async findByName(name: string): Promise<User | null> {
    return this.repository.findOne({ name });
  }
}

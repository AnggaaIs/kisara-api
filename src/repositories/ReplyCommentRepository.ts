import { ReplyComment } from "../entities/ReplyComment";
import { BaseRepository } from "./BaseRepository";
import { EntityRepository, QueryOrder } from "@mikro-orm/postgresql";

export class ReplyCommentRepository extends BaseRepository<ReplyComment> {
  constructor(repository: EntityRepository<ReplyComment>) {
    super(repository);
  }

  async findByParentId(parentId: string): Promise<ReplyComment[]> {
    return this.repository.find({ parent: { id: parentId } });
  }

  async getReplies(
    messageId: string,
    sortBy: "asc" | "desc" = "desc",
    page: number = 1,
    limit: number = 10
  ): Promise<[ReplyComment[], number]> {
    const order = sortBy === "desc" ? QueryOrder.DESC : QueryOrder.ASC;

    const offset = (page - 1) * limit;

    const [replies, total] = await this.repository
      .createQueryBuilder("r")
      .where("r.parent = ?", [messageId])
      .orderBy({ "r.created_at": order })
      .limit(limit)
      .offset(offset)
      .getResultAndCount();

    return [replies, total];
  }
}

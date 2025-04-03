import { Comment } from "../entities/Comment";
import { BaseRepository } from "./BaseRepository";
import { EntityRepository } from "@mikro-orm/postgresql";

export class CommentRepository extends BaseRepository<Comment> {
  constructor(repository: EntityRepository<Comment>) {
    super(repository);
  }

  async findByUserEmail(userEmail: string): Promise<Comment[]> {
    return this.repository.find({ user_email: userEmail });
  }

  async findWithReplies(id: string): Promise<Comment | null> {
    return this.repository.findOne({ id }, { populate: ["reply_comments"] });
  }

  async getComments(
    userEmail: string,
    sortBy: "asc" | "desc",
    page: number,
    limit: number
  ): Promise<[Comment[], number]> {
    const [comments, total] = await this.repository.findAndCount(
      { user_email: userEmail },
      {
        orderBy: { created_at: sortBy },
        limit,
        offset: (page - 1) * limit,
      }
    );

    return [comments, total];
  }
}

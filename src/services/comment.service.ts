import { Comment } from "../entities/Comment";
import { ReplyComment } from "../entities/ReplyComment";
import { CommentRepository } from "../repositories/CommentRepository";
import { ReplyCommentRepository } from "../repositories/ReplyCommentRepository";
import { UserService } from "./user.service";
import { AppError } from "../middlewares/error.middleware";
import { Reference, wrap } from "@mikro-orm/core";
import { StatusCode } from "../utils/app-response";
import { UserRepository } from "../repositories/UserRepository";

export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly replyCommentRepository: ReplyCommentRepository,
    private readonly userRepository: UserRepository,
    private readonly userService: UserService
  ) {}

  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Comment[]> {
    return this.commentRepository.findAll(options);
  }

  async findById(id: string): Promise<Comment | null> {
    return this.commentRepository.findWithReplies(id);
  }

  async findByUserEmail(userEmail: string): Promise<Comment[]> {
    return this.commentRepository.findByUserEmail(userEmail);
  }

  async create(linkId: string, message_content: string): Promise<Comment> {
    const user = await this.userRepository.findByLinkId(linkId);
    if (!user) {
      throw new AppError(
        `User with link_id ${linkId} not found`,
        StatusCode.NOT_FOUND
      );
    }

    return this.commentRepository.create({
      message_content: message_content,
      user: wrap(user).toReference(),
    });
  }

  async update(
    id: string,
    message_content: string,
    userEmail: string
  ): Promise<Comment | null> {
    const comment = await this.commentRepository.findById(id);

    if (!comment) {
      throw new AppError(`Comment with id ${id} not found`, 404);
    }

    if (comment.user_email !== userEmail) {
      throw new AppError(
        "You do not have permission to update this comment",
        403
      );
    }

    return this.commentRepository.update(id, { message_content });
  }

  async delete(id: string, userEmail: string): Promise<void> {
    const comment = await this.commentRepository.findById(id);

    if (!comment) {
      throw new AppError(`Comment with id ${id} not found`, 404);
    }

    if (comment.user_email !== userEmail) {
      throw new AppError(
        "You do not have permission to delete this comment",
        403
      );
    }

    await this.commentRepository.delete(id);
  }

  async replyToComment(
    commentId: string,
    userEmail: string,
    replyContent: string
  ): Promise<ReplyComment> {
    const parentComment = await this.commentRepository.findById(commentId);
    if (!parentComment) {
      throw new AppError(`Comment with id ${commentId} not found`, 404);
    }

    const user = await this.userService.findByEmail(userEmail);
    if (!user) {
      throw new AppError(`User with email ${userEmail} not found`, 404);
    }

    return this.replyCommentRepository.create({
      parent: Reference.create(parentComment),
      message_content: replyContent,
    });
  }

  async deleteReply(replyId: string, userEmail: string): Promise<void> {
    const reply = await this.replyCommentRepository.findById(replyId);

    if (!reply) {
      throw new AppError(`Reply with id ${replyId} not found`, 404);
    }

    const parentComment = await this.commentRepository.findById(
      reply.parent.id
    );
    if (!parentComment || parentComment.user_email !== userEmail) {
      throw new AppError(
        "You do not have permission to delete this reply",
        403
      );
    }

    await this.replyCommentRepository.delete(replyId);
  }

  async toggleLikeByCreator(
    commentId: string,
    userEmail: string
  ): Promise<Comment> {
    const comment = await this.findById(commentId);
    if (!comment) {
      throw new AppError(`Comment with id ${commentId} not found`, 404);
    }

    if (comment.user_email !== userEmail) {
      throw new AppError("You can only like your own comments");
    }

    return this.commentRepository.update(commentId, {
      like_by_creator: !comment.like_by_creator,
    }) as unknown as Comment;
  }

  async getStats(): Promise<Record<string, any>> {
    const userCount = await this.userRepository.count();
    const commentCount = await this.commentRepository.count();
    const replyCount = await this.replyCommentRepository.count();

    return {
      user_count: userCount,
      comment_count: commentCount,
      reply_count: replyCount,
    };
  }
}

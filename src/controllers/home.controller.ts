import { FastifyRequest, FastifyReply } from "fastify";
import { Database } from "../config/database";
import { Comment } from "../entities/Comment";
import { ReplyComment } from "../entities/ReplyComment";
import { User } from "../entities/User";
import { CommentRepository } from "../repositories/CommentRepository";
import { ReplyCommentRepository } from "../repositories/ReplyCommentRepository";
import { UserRepository } from "../repositories/UserRepository";
import { CommentService } from "../services/comment.service";
import { UserService } from "../services/user.service";
import { AppResponse, StatusCode } from "../utils/app-response";

export class HomeController {
  private readonly commentRepository: CommentRepository;
  private readonly replyCommentRepository: ReplyCommentRepository;
  private readonly userRepository: UserRepository;
  public readonly userService: UserService;
  public readonly commentService: CommentService;

  constructor() {
    this.commentRepository = new CommentRepository(
      Database.getORM().em.getRepository(Comment)
    );
    this.replyCommentRepository = new ReplyCommentRepository(
      Database.getORM().em.getRepository(ReplyComment)
    );
    this.userRepository = new UserRepository(
      Database.getORM().em.getRepository(User)
    );
    this.userService = new UserService(this.userRepository);
    this.commentService = new CommentService(
      this.commentRepository,
      this.replyCommentRepository,
      this.userRepository,
      this.userService
    );
  }

  async getHandleStats(req: FastifyRequest, reply: FastifyReply) {
    const stats = await this.commentService.getStats();

    return AppResponse.sendSuccessResponse(
      req,
      reply,
      StatusCode.OK,
      "Stats retrieved successfully",
      stats
    );
  }
}

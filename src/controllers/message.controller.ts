import { FastifyReply, FastifyRequest } from "fastify";
import { CommentRepository } from "../repositories/CommentRepository";
import { ReplyCommentRepository } from "../repositories/ReplyCommentRepository";
import { Database } from "../config/database";
import { Comment } from "../entities/Comment";
import { ReplyComment } from "../entities/ReplyComment";
import { UserRepository } from "../repositories/UserRepository";
import { AppError } from "../middlewares/error.middleware";
import { AppResponse, StatusCode } from "../utils/app-response";
import { User } from "../entities/User";
import { CommentService } from "../services/comment.service";
import { UserService } from "../services/user.service";
import { NotificationService } from "../services/notification.service";

export class MessageController {
  private readonly commentRepository: CommentRepository;
  private readonly replyCommentRepository: ReplyCommentRepository;
  private readonly userRepository: UserRepository;
  public readonly userService: UserService;
  public readonly commentService: CommentService;
  private readonly notificationService: NotificationService;

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
    this.notificationService = new NotificationService();
  }

  async handleMessagePost(req: FastifyRequest, reply: FastifyReply) {
    const { link_id } = req.params as { link_id: string };
    const { message_content } = req.body as { message_content: string };

    const comment = await this.commentService.create(link_id, message_content);

    const recipientUser = await this.userRepository.findByLinkId(link_id);

    if (recipientUser) {
      await this.notificationService.sendMessageNotification(
        recipientUser.email,
        {
          type: "new_message",
          messageId: comment.id,
          senderId: "anonymous",
          senderName: "Seseorang",
          content: message_content,
          linkId: link_id,
        }
      );
    }

    return AppResponse.sendSuccessResponse(
      req,
      reply,
      StatusCode.CREATED,
      "Message posted successfully",
      {
        id: comment.id,
        message_content: comment.message_content,
        created_at: comment.created_at,
      }
    );
  }

  async handleMessageGet(req: FastifyRequest, reply: FastifyReply) {
    const { link_id } = req.params as { link_id: string };
    const {
      sortBy = "desc",
      page = 1,
      limit = 10,
    } = req.query as {
      sortBy?: "asc" | "desc";
      page?: number;
      limit?: number;
    };

    const user = await this.userRepository.findByLinkId(link_id);
    if (!user) {
      throw new AppError(
        `User with link_id ${link_id} not found`,
        StatusCode.NOT_FOUND
      );
    }

    const [comments, total] = await this.commentRepository.getComments(
      user.email,
      sortBy,
      page,
      limit
    );

    const filteredComments = comments.map((comment) => ({
      id: comment.id,
      message_content: comment.message_content,
      like_by_creator: comment.like_by_creator,
      created_at: comment.created_at,
    }));

    return AppResponse.sendSuccessResponse(
      req,
      reply,
      StatusCode.OK,
      "Comments retrieved successfully",
      {
        page,
        limit,
        total_records: total,
        total_pages: Math.ceil(total / limit),
        author: {
          name: user.name,
          role: user.role,
          profile_url: user.profile_url,
        },
        comments: filteredComments,
      }
    );
  }

  async handleDeleteMessage(req: FastifyRequest, reply: FastifyReply) {
    const { link_id, message_id } = req.params as {
      link_id: string;
      message_id: string;
    };
    const email = req.user?.email;

    const user = await this.userRepository.findByLinkId(link_id);
    if (!user) {
      throw new AppError(
        `User with link_id ${link_id} not found`,
        StatusCode.NOT_FOUND
      );
    }

    if (user.email !== email) {
      throw new AppError(
        "User not authorized to delete message",
        StatusCode.UNAUTHORIZED
      );
    }

    const deleted = await this.commentRepository.delete(message_id);
    if (!deleted) {
      throw new AppError(
        `Message with id ${message_id} not found`,
        StatusCode.NOT_FOUND
      );
    }

    return AppResponse.sendSuccessNoDataResponse(
      req,
      reply,
      StatusCode.OK,
      "Message deleted successfully"
    );
  }

  async handleReplyMessagePost(req: FastifyRequest, reply: FastifyReply) {
    const { link_id, message_id } = req.params as {
      link_id: string;
      message_id: string;
    };
    const { message_content } = req.body as { message_content: string };
    const email = req.user?.email;

    const user = await this.userRepository.findByLinkId(link_id);
    if (!user) {
      throw new AppError(
        `User with link_id ${link_id} not found`,
        StatusCode.NOT_FOUND
      );
    }

    if (user.email !== email) {
      throw new AppError(
        "User not authorized to reply",
        StatusCode.UNAUTHORIZED
      );
    }

    const replyComment = await this.commentService.replyToComment(
      message_id,
      message_content,
      user.email
    );

    return AppResponse.sendSuccessResponse(
      req,
      reply,
      StatusCode.CREATED,
      "Reply posted successfully",
      {
        message_id,
        reply_message_id: replyComment.id,
        message_content: replyComment.message_content,
        created_at: replyComment.created_at,
      }
    );
  }

  async handleReplyMessageGet(req: FastifyRequest, reply: FastifyReply) {
    const { link_id, message_id } = req.params as {
      link_id: string;
      message_id: string;
    };
    const {
      sortBy = "desc",
      page = 1,
      limit = 10,
    } = req.query as {
      sortBy?: "asc" | "desc";
      page?: number;
      limit?: number;
    };

    const user = await this.userRepository.findByLinkId(link_id);
    if (!user) {
      throw new AppError(
        `User with link_id ${link_id} not found`,
        StatusCode.NOT_FOUND
      );
    }

    const comment = await this.commentRepository.findById(message_id);
    if (!comment) {
      throw new AppError(
        `Message with id ${message_id} not found`,
        StatusCode.NOT_FOUND
      );
    }

    const [replies, total] = await this.replyCommentRepository.getReplies(
      message_id,
      sortBy,
      page,
      limit
    );

    return AppResponse.sendSuccessResponse(
      req,
      reply,
      StatusCode.OK,
      "Replies retrieved successfully",
      {
        page,
        limit,
        total_records: total,
        total_pages: Math.ceil(total / limit),
        replies,
      }
    );
  }

  async handleDeleteReplyMessage(req: FastifyRequest, reply: FastifyReply) {
    const { link_id, message_id, reply_id } = req.params as {
      link_id: string;
      message_id: string;
      reply_id: string;
    };
    const email = req.user?.email;

    const user = await this.userRepository.findByLinkId(link_id);
    if (!user) {
      throw new AppError(
        `User with link_id ${link_id} not found`,
        StatusCode.NOT_FOUND
      );
    }

    if (user.email !== email) {
      throw new AppError(
        "User not authorized to delete reply",
        StatusCode.UNAUTHORIZED
      );
    }

    const reply2 = await this.replyCommentRepository.findById(reply_id);
    if (!reply2 || reply2.parent.id !== message_id) {
      throw new AppError(
        `Reply with id ${reply_id} not found`,
        StatusCode.NOT_FOUND
      );
    }

    const deleted = await this.replyCommentRepository.delete(reply_id);
    if (!deleted) {
      throw new AppError(
        `Reply with id ${reply_id} not found`,
        StatusCode.NOT_FOUND
      );
    }

    return AppResponse.sendSuccessResponse(
      req,
      reply,
      StatusCode.OK,
      "Reply deleted successfully"
    );
  }

  async handleLikeMessage(req: FastifyRequest, reply: FastifyReply) {
    const { link_id, message_id } = req.params as {
      link_id: string;
      message_id: string;
    };
    const email = req.user?.email;

    const user = await this.userRepository.findByLinkId(link_id);
    if (!user) {
      throw new AppError(
        `User with link_id ${link_id} not found`,
        StatusCode.NOT_FOUND
      );
    }

    const comment = await this.commentService.toggleLikeByCreator(
      message_id,
      email!
    )!;

    return AppResponse.sendSuccessResponse(
      req,
      reply,
      StatusCode.OK,
      "Like status updated successfully",
      {
        message_id: comment.id,
        like_by_creator: comment.like_by_creator,
      }
    );
  }
}

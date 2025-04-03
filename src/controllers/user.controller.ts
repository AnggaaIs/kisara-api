import { FastifyRequest, FastifyReply } from "fastify";
import { UserRepository } from "../repositories/UserRepository";
import { AppError } from "../middlewares/error.middleware";
import { AppResponse, StatusCode } from "../utils/app-response";
import { User } from "../entities/User";
import { wrap } from "@mikro-orm/core";
import { UserUpdateBody } from "../models/validation/user.validation";
import { Database } from "../config/database";

export class UserController {
  private readonly userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository(
      Database.getORM().em.getRepository(User)
    );
  }

  async handleGetUser(req: FastifyRequest, reply: FastifyReply) {
    const email = req.user?.email;

    const user = await this.userRepository.findByEmail(email as string);
    if (!user) {
      throw new AppError("User not found", StatusCode.NOT_FOUND);
    }

    const userResponse = {
      name: user.name,
      link_id: user.link_id,
      profile_url: user.profile_url,
    };

    return AppResponse.sendSuccessResponse(
      req,
      reply,
      StatusCode.OK,
      "User found",
      userResponse
    );
  }

  async handleUpdateUser(req: FastifyRequest, reply: FastifyReply) {
    const email = req.user?.email;
    const dataUpdate = req.body as typeof UserUpdateBody;

    const user = await this.userRepository.findByEmail(email as string);
    if (!user) {
      throw new AppError("User not found", StatusCode.NOT_FOUND);
    }

    const oldUser = { ...user };

    let updated = false;
    for (const key in dataUpdate) {
      if (
        dataUpdate[key as keyof User] &&
        dataUpdate[key as keyof User] !== user[key as keyof User]
      ) {
        user[key as keyof User] = dataUpdate[key as keyof User];
        updated = true;
      }
    }

    if (!updated) {
      return AppResponse.sendSuccessResponse(
        req,
        reply,
        StatusCode.OK,
        "No changes made",
        null
      );
    }

    await this.userRepository.save(user);

    return AppResponse.sendSuccessResponse(
      req,
      reply,
      StatusCode.OK,
      "User updated",
      {
        old_data: oldUser,
        new_data: user,
      }
    );
  }
}

import { User } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";
import { AppError } from "../middlewares/error.middleware";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    return this.userRepository.findAll(options);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findByLinkId(linkId: string): Promise<User | null> {
    return this.userRepository.findByLinkId(linkId);
  }

  async create(userData: Partial<User>): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(userData.email!);
    if (existingUser) {
      throw new AppError(
        `User with email ${userData.email} already exists`,
        409
      );
    }

    return this.userRepository.create(userData);
  }

  async update(email: string, userData: Partial<User>): Promise<User | null> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (!existingUser) {
      throw new AppError(`User with email ${email} not found`, 404);
    }

    return this.userRepository.update(email, userData);
  }

  async delete(email: string): Promise<boolean> {
    const result = await this.userRepository.delete(email);
    if (!result) {
      throw new AppError(`User with email ${email} not found`, 404);
    }
    return result;
  }
}

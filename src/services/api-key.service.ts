import { environment } from "../config/environment";
import { ApiKey } from "../entities/ApiKey";
import { User } from "../entities/User";
import { AppError } from "../middlewares/error.middleware";
import { UserService } from "./user.service";
import { ApiKeyRepository } from "../repositories/ApiKeyRepository";
import { ApiKeyUtil, GeneratedApiKey } from "../utils/api-key.util";

export interface ApiKeyView {
  id: string;
  name: string;
  key_id: string;
  last_four: string;
  created_at: Date;
  updated_at: Date;
  revoked_at?: Date;
  expires_at?: Date;
}

export class ApiKeyService {
  constructor(
    private readonly userService: UserService,
    private readonly apiKeyRepository: ApiKeyRepository
  ) {}

  async createForUser(user: User, name: string): Promise<GeneratedApiKey> {
    const apiKeyMaterial = ApiKeyUtil.generateApiKeyMaterial();
    await this.apiKeyRepository.create({
      name,
      key_id: apiKeyMaterial.keyId,
      secret_hash: apiKeyMaterial.secretHash,
      last_four: apiKeyMaterial.lastFour,
      user,
    } as Partial<ApiKey>);

    return apiKeyMaterial;
  }

  async listForUser(userId: string): Promise<ApiKeyView[]> {
    const apiKeys = await this.apiKeyRepository.findByUserId(userId);

    return apiKeys.map((apiKey) => this.toView(apiKey));
  }

  async revokeForUser(userId: string, apiKeyId: string): Promise<ApiKeyView> {
    const apiKey = await this.apiKeyRepository.findByUserAndId(
      userId,
      apiKeyId
    );

    if (!apiKey) {
      throw new AppError("API key not found", 404);
    }

    if (apiKey.revoked_at) {
      return this.toView(apiKey);
    }

    apiKey.revoked_at = new Date();
    await this.apiKeyRepository.save(apiKey);

    return this.toView(apiKey);
  }

  async verifyApiKey(apiKeyValue: string): Promise<User> {
    const parsed = ApiKeyUtil.parseApiKey(apiKeyValue);

    if (!parsed) {
      throw new AppError("Invalid API key", 401);
    }

    const expectedKeyType =
      environment.nodeEnv === "production" ? "live" : "dev";

    if (parsed.keyType !== expectedKeyType) {
      throw new AppError("Invalid API key", 401);
    }

    const storedApiKey = await this.apiKeyRepository.findByKeyId(parsed.keyId);

    if (!storedApiKey || storedApiKey.revoked_at) {
      throw new AppError("Invalid API key", 401);
    }

    if (
      storedApiKey.expires_at &&
      storedApiKey.expires_at.getTime() < Date.now()
    ) {
      throw new AppError("API key has expired", 401);
    }

    if (!ApiKeyUtil.verifySecret(parsed.secret, storedApiKey.secret_hash)) {
      throw new AppError("Invalid API key", 401);
    }

    const user = await this.userService.findByEmail(storedApiKey.user.email);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  private toView(apiKey: ApiKey): ApiKeyView {
    return {
      id: apiKey.id,
      name: apiKey.name,
      key_id: apiKey.key_id,
      last_four: apiKey.last_four,
      created_at: apiKey.created_at,
      updated_at: apiKey.updated_at,
      revoked_at: apiKey.revoked_at,
      expires_at: apiKey.expires_at,
    };
  }
}

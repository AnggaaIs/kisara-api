import crypto from "crypto";
import { environment } from "../config/environment";

export interface GeneratedApiKey {
  apiKey: string;
  keyId: string;
  secretHash: string;
  lastFour: string;
  keyType: "live" | "dev";
}

interface ParsedApiKey {
  keyType: "live" | "dev";
  keyId: string;
  secret: string;
}

export class ApiKeyUtil {
  static generateApiKeyMaterial(): GeneratedApiKey {
    const keyType = environment.nodeEnv === "production" ? "live" : "dev";
    const keyId = crypto.randomBytes(12).toString("base64url");
    const secret = crypto.randomBytes(32).toString("base64url");
    const apiKey = `ksr_${keyType}_${keyId}.${secret}`;

    return {
      apiKey,
      keyId,
      secretHash: this.hashSecret(secret),
      lastFour: secret.slice(-4),
      keyType,
    };
  }

  static parseApiKey(apiKey: string): ParsedApiKey | null {
    const match =
      /^ksr_(live|dev)_([A-Za-z0-9_-]{8,64})\.([A-Za-z0-9_-]{16,128})$/.exec(
        apiKey.trim()
      );

    if (!match) {
      return null;
    }

    return {
      keyType: match[1] as "live" | "dev",
      keyId: match[2],
      secret: match[3],
    };
  }

  static hashSecret(secret: string): string {
    return crypto.createHash("sha256").update(secret).digest("hex");
  }

  static verifySecret(secret: string, hash: string): boolean {
    const expected = Buffer.from(hash, "hex");
    const actual = Buffer.from(this.hashSecret(secret), "hex");

    if (expected.length !== actual.length) {
      return false;
    }

    return crypto.timingSafeEqual(expected, actual);
  }
}

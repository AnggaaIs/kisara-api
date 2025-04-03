import crypto from "crypto";
import { EntityManager } from "@mikro-orm/core";
import { User } from "../entities/User";

export class GenerateUtil {
  static generateRandomState(length: number): string {
    return crypto.randomBytes(length).toString("base64").slice(0, length);
  }

  static generateLinkID(length: number): string {
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    let linkID = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      linkID += characters[randomIndex];
    }
    return linkID;
  }

  static async generateUniqueLinkID(
    em: EntityManager,
    length: number
  ): Promise<string> {
    while (true) {
      const linkID = this.generateLinkID(length);
      const count = await em.count(User, { link_id: linkID });

      if (count === 0) {
        return linkID;
      }
    }
  }
}

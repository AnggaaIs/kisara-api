import { Type } from "@sinclair/typebox";

export const ApiKeyCreateBody = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 80 }),
});

import { Type } from "@sinclair/typebox";

export const AuthGoogleCallbackBody = Type.Object({
  code: Type.String({ minLength: 1, maxLength: 50 }),
  state: Type.String({ minLength: 1, maxLength: 30 }),
});

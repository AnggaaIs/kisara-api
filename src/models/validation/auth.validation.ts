import { Type } from "@sinclair/typebox";

export const AuthGoogleCallbackBody = Type.Object({
  code: Type.String({ minLength: 1, maxLength: 150 }),
  state: Type.String({ minLength: 1, maxLength: 150 }),
});

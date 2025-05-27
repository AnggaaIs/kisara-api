import { Type } from "@sinclair/typebox";

export const AuthGoogleCallbackBody = Type.Object({
  code: Type.String({ minLength: 1, maxLength: 150 }),
  state: Type.String({ minLength: 1, maxLength: 150 }),
});

export const AuthGoogleMobileBody = Type.Object({
  id_token: Type.String({ minLength: 1, maxLength: 2000 }),
});

export const RefreshTokenBody = Type.Object({
  refresh_token: Type.String({ minLength: 1, maxLength: 200 }),
});

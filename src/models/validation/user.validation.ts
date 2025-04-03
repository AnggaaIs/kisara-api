import { Type } from "@sinclair/typebox";

export const UserUpdateBody = Type.Object({
  nickname: Type.Optional(Type.String({ maxLength: 15 })),
});

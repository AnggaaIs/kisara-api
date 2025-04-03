import { Type } from "@sinclair/typebox";

export const MessageBodyPost = Type.Object({
  message_content: Type.String({ minLength: 1, maxLength: 500 }),
});

export const MessageBodyGet = Type.Object({
  sort_by: Type.Optional(
    Type.Enum(
      {
        asc: "asc",
        desc: "desc",
      },
      { default: "desc" }
    )
  ),
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, default: 10 })),
});

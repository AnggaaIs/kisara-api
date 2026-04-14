import { Type, type TSchema } from "@sinclair/typebox";

export const ApiMetadataSchema = Type.Object({
  method: Type.String(),
  url: Type.String(),
  execution_time_ms: Type.Number(),
  ip: Type.String(),
  timestamp: Type.String({ format: "date-time" }),
});

export const ApiErrorSchema = Type.Object({
  status_code: Type.Number(),
  message: Type.String(),
  metadata: ApiMetadataSchema,
});

export const ApiValidationErrorSchema = Type.Object({
  status_code: Type.Number(),
  message: Type.String(),
  errors: Type.Array(Type.Any()),
  metadata: ApiMetadataSchema,
});

export const buildSuccessResponseSchema = <T extends TSchema>(
  data: T,
  statusCode: number
) =>
  Type.Object({
    status_code: Type.Literal(statusCode),
    message: Type.String(),
    data,
    metadata: ApiMetadataSchema,
  });

export const buildSuccessNoDataResponseSchema = (statusCode: number) =>
  Type.Object({
    status_code: Type.Literal(statusCode),
    message: Type.String(),
    metadata: ApiMetadataSchema,
  });

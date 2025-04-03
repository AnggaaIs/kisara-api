import { validate, ValidationError } from "class-validator";
import { plainToInstance } from "class-transformer";
import { FastifyRequest, FastifyReply } from "fastify";

export function validateRequest<T extends object>(type: new () => T) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const input = plainToInstance(type, request.body);
    const errors = await validate(input);

    if (errors.length > 0) {
      const formattedErrors = formatValidationErrors(errors);
      reply.status(400).send({
        statusCode: 400,
        message: "Validation failed",
        errors: formattedErrors,
      });
      return;
    }

    request.body = input;
  };
}

function formatValidationErrors(
  errors: ValidationError[]
): Record<string, string[]> {
  return errors.reduce(
    (acc, error) => {
      const property = error.property;
      const constraints = error.constraints
        ? Object.values(error.constraints)
        : ["Invalid value"];

      acc[property] = constraints;

      return acc;
    },
    {} as Record<string, string[]>
  );
}

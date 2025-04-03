import { FastifySchemaValidationError } from "fastify/types/schema";

export class ValidatorService {
  static validate(
    schema: FastifySchemaValidationError[],
    data: any
  ): { field: string; message: string }[] {
    const errors = schema.map((s) => {
      const path = s.instancePath.replace(/^\//, "");
      const message = this.getCustomErrorMessage(s, data);
      return { field: path, message };
    });

    return errors;
  }

  private static getCustomErrorMessage(
    error: FastifySchemaValidationError,
    data: any
  ): string {
    switch (error.keyword) {
      case "required":
        return this.formatRequiredError(error, data);
      case "type":
        return this.formatTypeError(error, data);
      case "minLength":
        return this.formatMinLengthError(error, data);
      case "maxLength":
        return this.formatMaxLengthError(error, data);
      case "minimum":
        return this.formatMinimumError(error, data);
      case "maximum":
        return this.formatMaximumError(error, data);
      case "pattern":
        return this.formatPatternError(error, data);
      case "format":
        return this.formatFormatError(error, data);
      case "enum":
        return this.formatEnumError(error, data);
      default:
        return this.formatGenericError(error, data);
    }
  }

  private static formatRequiredError(
    error: FastifySchemaValidationError,
    data: any
  ): string {
    const path = error.instancePath.replace(/^\//, "");
    return `'${path}' is required. Please provide a valid value.`;
  }

  private static formatTypeError(
    error: FastifySchemaValidationError,
    data: any
  ): string {
    const path = error.instancePath.replace(/^\//, "");
    return `'${path}' must be of type ${error.params.type}. You provided a value of type ${typeof data[path]}.`;
  }

  private static formatMinLengthError(
    error: FastifySchemaValidationError,
    data: any
  ): string {
    const path = error.instancePath.replace(/^\//, "");
    const dataLength = Array.isArray(data[path])
      ? data[path].length
      : typeof data[path] === "string"
        ? data[path].length
        : 0;
    return `'${path}' must have a minimum length of ${error.params.limit}. Current length is ${dataLength}.`;
  }

  private static formatMaxLengthError(
    error: FastifySchemaValidationError,
    data: any
  ): string {
    const path = error.instancePath.replace(/^\//, "");
    const dataLength = Array.isArray(data[path])
      ? data[path].length
      : typeof data[path] === "string"
        ? data[path].length
        : 0;
    return `'${path}' must have a maximum length of ${error.params.limit}. Current length is ${dataLength}.`;
  }

  private static formatMinimumError(
    error: FastifySchemaValidationError,
    data: any
  ): string {
    const path = error.instancePath.replace(/^\//, "");
    return `'${path}' must have a value greater than or equal to ${error.params.limit}. You provided ${data[path]}.`;
  }

  private static formatMaximumError(
    error: FastifySchemaValidationError,
    data: any
  ): string {
    const path = error.instancePath.replace(/^\//, "");
    return `'${path}' must have a value less than or equal to ${error.params.limit}. You provided ${data[path]}.`;
  }

  private static formatPatternError(
    error: FastifySchemaValidationError,
    data: any
  ): string {
    const path = error.instancePath.replace(/^\//, "");
    return `'${path}' must match the pattern "${error.params.pattern}". The value provided "${data[path]}" does not match.`;
  }

  private static formatFormatError(
    error: FastifySchemaValidationError,
    data: any
  ): string {
    const path = error.instancePath.replace(/^\//, "");
    return `'${path}' must follow the format "${error.params.format}". The value provided "${data[path]}" is invalid.`;
  }

  private static formatEnumError(
    error: FastifySchemaValidationError,
    data: any
  ): string {
    const path = error.instancePath.replace(/^\//, "");
    const allowedValues = error.params.allowedValues as string[];
    return `'${path}' must be one of the following values: ${allowedValues.join(", ")}. The value provided "${data[path]}" is not allowed.`;
  }

  private static formatGenericError(
    error: FastifySchemaValidationError,
    data: any
  ): string {
    const path = error.instancePath.replace(/^\//, "");
    return `Invalid value at '${path}'. Please review the data provided. The value you provided is: ${data[path]}.`;
  }
}

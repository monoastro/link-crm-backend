import HttpError from "#/middlewares/errors/HttpError.js";
import { humanizeField } from "#/middlewares/errors/helper.js";

import { StatusCodes } from "http-status-codes";

export function parseBody(schema, body) {
  const result = schema.safeParse(body);

  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path?.join(".");
    const message = field
      ? `${humanizeField(field)}: ${issue.message}`
      : issue?.message || "Invalid request data";
    throw new HttpError(message, StatusCodes.BAD_REQUEST);
  }

  return result.data;
}

import HttpError from "#/middlewares/errors/HttpError.js";

import { StatusCodes } from "http-status-codes";

export function parseBody(schema, body) {
  const result = schema.safeParse(body);

  if (!result.success) {
    const message = result.error.issues[0]?.message || "Invalid request data";
    throw new HttpError(message, StatusCodes.BAD_REQUEST);
  }

  return result.data;
}

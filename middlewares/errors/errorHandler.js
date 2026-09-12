import { DrizzleQueryError } from "drizzle-orm/errors";
import { DatabaseError } from "pg";
import {
  parseForeignKeyDetail,
  parseUniqueViolationDetail,
  humanizeField,
} from "./helper.js";

const errorHandler = (err, req, res, next) => {
  console.log("error ", err);

  if (err instanceof DrizzleQueryError && err.cause instanceof DatabaseError) {
    const pgErr = err.cause;

    switch (pgErr.code) {
      case "23505": {
        // unique_violation

        const parsed = parseUniqueViolationDetail(pgErr.detail);
        const message = parsed
          ? `${humanizeField(parsed.column)} "${parsed.value}" is already taken`
          : "This value already exists";

        return res.status(409).json({ success: false, message });
      }

      case "23503": {
        // foreign_key_violation
        const parsed = parseForeignKeyDetail(pgErr.detail);
        const message = parsed
          ? `${humanizeField(parsed.column)} "${parsed.value}" does not exist`
          : "Referenced record does not exist";
        return res.status(400).json({ success: false, message });
      }

      case "23502": {
        // not_null_violation
        const message = `${humanizeField(pgErr.column)} is required`;
        return res.status(400).json({ success: false, message });
      }

      case "22P02": // invalid_text_representation
        return res.status(400).json({
          success: false,
          message: "Invalid input value",
        });

      default:
        console.error("Unhandled Postgres error:", pgErr);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
    }
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.statusCode ? err.message : "Something went wrong",
  });
};

export default errorHandler;


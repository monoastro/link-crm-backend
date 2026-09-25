// src/modules/notifications/notificationController.js
import { StatusCodes } from "http-status-codes";
import HttpError from "#/middlewares/errors/HttpError.js";
import { findNotificationsForRole } from "./notificationQueries.js";

//===================================================================

export async function getNotificationsController(req, res) {
  const role = req.user?.role;
  if (!role) {
    throw new HttpError("Role not found on request", StatusCodes.UNAUTHORIZED);
  }

  const { after } = req.query;
  let afterId = null;

  if (after !== undefined) {
    afterId = Number(after);
    if (!Number.isInteger(afterId)) {
      throw new HttpError("`after` must be an integer id", StatusCodes.BAD_REQUEST);
    }
  }

  console.log(`Fetching notifications for role: ${role}, afterId: ${afterId}`);

  const items = await findNotificationsForRole(role, afterId);
  const lastId = items.length > 0 ? items[items.length - 1].id : afterId;

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Notifications fetched successfully",
    items,
    lastId,
  });
}

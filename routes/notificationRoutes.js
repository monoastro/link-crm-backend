// src/modules/notifications/notificationRoutes.js
import { Router } from "express";
import { getNotificationsController } from "#/controllers/notifications/notificationController.js";
import { authenticateUser, authorizePermissions } from "#/middlewares/authentication/auth.js";

const router = Router();

router.get("/", authenticateUser, getNotificationsController);

export default router;

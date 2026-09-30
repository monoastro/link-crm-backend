// src/modules/notifications/notificationRoutes.js
import { Router } from "express";
import { getNotificationsController } from "#/controllers/notifications/notificationController.js";
import { authenticateUser, authorizePermissions } from "#/middlewares/authentication/auth.js";
import { addClient, removeClient } from "#/controllers/notifications/notificationHub.js";

const router = Router();

router.get("/", authenticateUser, getNotificationsController);
// notificationRoutes.js
router.get("/stream", authenticateUser, (req, res) => {
  const role = req.user.role;

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // tells nginx not to buffer this response
  });
  res.flushHeaders();

  addClient(role, res);

  // heartbeat so proxies don't kill idle connections
  const hb = setInterval(() => res.write(": ping\n\n"), 25000);

  req.on("close", () => {
    clearInterval(hb);
    removeClient(role, res);
  });
});

export default router;

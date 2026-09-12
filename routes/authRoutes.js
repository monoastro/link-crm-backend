import { Router } from "express";

import { authenticateUser } from "#/middlewares/authentication/auth.js";
import { login, logout, me } from "#/controllers/auth/authController.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticateUser, me);

export default router;


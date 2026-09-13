import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import { Router } from "express";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;


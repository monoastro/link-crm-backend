import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import candidateRoutes from "./candidateRoutes.js";
import { Router } from "express";


const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/candidates", candidateRoutes);

export default router;


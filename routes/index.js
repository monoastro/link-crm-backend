import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import candidateRoutes from "./candidateRoutes.js";
import companyRoutes from "./companyRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import { Router } from "express";


const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/candidates", candidateRoutes);
router.use("/companies", companyRoutes);
router.use("/notifications", notificationRoutes);

export default router;


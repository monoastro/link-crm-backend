import { getDashboardController } from "#/controllers/dashboard/dashboardController.js";
import { Router } from "express";

const router = Router();

router.get("/", getDashboardController);

export default router;

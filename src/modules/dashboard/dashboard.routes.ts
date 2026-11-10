import { Router } from "express";
import { DashboardController } from "./dashboard.controller.js";
import { authMiddleware } from "../../middlewares/authmiddleware/auth.middleware.js";

const router = Router();
const controller = new DashboardController();

router.use(authMiddleware);

router.get("/metrics", controller.getMetrics);

export default router;


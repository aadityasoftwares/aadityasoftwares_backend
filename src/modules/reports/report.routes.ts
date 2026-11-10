import { Router } from "express";
import { ReportController } from "./report.controller.js";
import { authMiddleware } from "../../middlewares/authmiddleware/auth.middleware.js";
import { requirePermission } from "../permissions/middlewares/permission.middleware.js";
import { PermissionAction, PermissionModule } from "../permissions/constants/permission.enums.js";

const router = Router();
const controller = new ReportController();

router.use(authMiddleware);
router.use(requirePermission(PermissionModule.REPORT, PermissionAction.READ));

router.get("/revenue", controller.revenue);
router.get("/invoices", controller.invoices);
router.get("/outstanding", controller.outstanding);
router.get("/gst", controller.gst);
router.get("/conversions", controller.conversions);
router.get("/expenses", controller.expenses);

export default router;


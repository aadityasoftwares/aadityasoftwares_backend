import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";
import { authMiddleware } from "../../../middlewares/authmiddleware/auth.middleware.js";
import { requirePermission } from "../../permissions/middlewares/permission.middleware.js";
import { PermissionAction, PermissionModule } from "../../permissions/constants/permission.enums.js";
import { validateId } from "../../../utils/validations/validateId.validation.js";
import { validatePagination } from "../../../utils/validations/validatePagination.js";

const router = Router();
const controller = new PaymentController();

router.use(authMiddleware);

router.post(
    "/",
    requirePermission(PermissionModule.PAYMENT, PermissionAction.CREATE),
    controller.record,
);

router.get(
    "/",
    requirePermission(PermissionModule.PAYMENT, PermissionAction.READ),
    validatePagination(),
    controller.getAll,
);

router.get(
    "/:id",
    requirePermission(PermissionModule.PAYMENT, PermissionAction.READ),
    validateId,
    controller.getById,
);

router.get(
    "/invoice/:invoiceId",
    requirePermission(PermissionModule.PAYMENT, PermissionAction.READ),
    controller.getByInvoice,
);

router.post(
    "/:id/reverse",
    requirePermission(PermissionModule.PAYMENT, PermissionAction.REVERSE),
    validateId,
    controller.reverse,
);

export default router;


import { Router } from "express";
import { InvoiceController } from "../controllers/invoice.controller.js";
import { authMiddleware } from "../../../middlewares/authmiddleware/auth.middleware.js";
import { requirePermission } from "../../permissions/middlewares/permission.middleware.js";
import { PermissionAction, PermissionModule } from "../../permissions/constants/permission.enums.js";
import { validateId } from "../../../utils/validations/validateId.validation.js";
import { validatePagination } from "../../../utils/validations/validatePagination.js";

const router = Router();
const controller = new InvoiceController();

router.use(authMiddleware);

router.post(
    "/",
    requirePermission(PermissionModule.INVOICE, PermissionAction.CREATE),
    controller.create,
);

router.get(
    "/",
    requirePermission(PermissionModule.INVOICE, PermissionAction.READ),
    validatePagination(),
    controller.getAll,
);

router.get(
    "/:id",
    requirePermission(PermissionModule.INVOICE, PermissionAction.READ),
    validateId,
    controller.getById,
);

router.get(
    "/:id/pdf",
    requirePermission(PermissionModule.INVOICE, PermissionAction.READ),
    validateId,
    controller.downloadPdf,
);

router.post(
    "/:id/send-email",
    requirePermission(PermissionModule.INVOICE, PermissionAction.UPDATE),
    validateId,
    controller.sendEmail,
);

router.put(
    "/:id",
    requirePermission(PermissionModule.INVOICE, PermissionAction.UPDATE),
    validateId,
    controller.update,
);

router.post(
    "/:id/cancel",
    requirePermission(PermissionModule.INVOICE, PermissionAction.CANCEL),
    validateId,
    controller.cancel,
);

router.delete(
    "/:id",
    requirePermission(PermissionModule.INVOICE, PermissionAction.DELETE),
    validateId,
    controller.delete,
);

export default router;


import { Router } from "express";
import { QuotationController } from "../controllers/quotation.controller.js";
import { authMiddleware } from "../../../middlewares/authmiddleware/auth.middleware.js";
import { requirePermission } from "../../permissions/middlewares/permission.middleware.js";
import { PermissionAction, PermissionModule } from "../../permissions/constants/permission.enums.js";
import { validateId } from "../../../utils/validations/validateId.validation.js";
import { validatePagination } from "../../../utils/validations/validatePagination.js";

const router = Router();
const controller = new QuotationController();

router.use(authMiddleware);

router.post(
    "/",
    requirePermission(PermissionModule.QUOTATION, PermissionAction.CREATE),
    controller.create,
);

router.get(
    "/",
    requirePermission(PermissionModule.QUOTATION, PermissionAction.READ),
    validatePagination(),
    controller.getAll,
);

router.get(
    "/:id",
    requirePermission(PermissionModule.QUOTATION, PermissionAction.READ),
    validateId,
    controller.getById,
);

router.get(
    "/:id/pdf",
    requirePermission(PermissionModule.QUOTATION, PermissionAction.READ),
    validateId,
    controller.downloadPdf,
);

router.put(
    "/:id",
    requirePermission(PermissionModule.QUOTATION, PermissionAction.UPDATE),
    validateId,
    controller.update,
);

router.delete(
    "/:id",
    requirePermission(PermissionModule.QUOTATION, PermissionAction.DELETE),
    validateId,
    controller.delete,
);

export default router;


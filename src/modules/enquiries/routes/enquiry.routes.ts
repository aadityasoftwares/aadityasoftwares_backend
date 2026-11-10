import { Router } from "express";
import { EnquiryController } from "../controllers/enquiry.controller.js";
import { authMiddleware } from "../../../middlewares/authmiddleware/auth.middleware.js";
import { requirePermission } from "../../permissions/middlewares/permission.middleware.js";
import { PermissionAction, PermissionModule } from "../../permissions/constants/permission.enums.js";
import { validateId } from "../../../utils/validations/validateId.validation.js";
import { validatePagination } from "../../../utils/validations/validatePagination.js";

const router = Router();
const controller = new EnquiryController();

router.use(authMiddleware);

router.post(
    "/",
    requirePermission(PermissionModule.ENQUIRY, PermissionAction.CREATE),
    controller.create,
);

router.get(
    "/",
    requirePermission(PermissionModule.ENQUIRY, PermissionAction.READ),
    validatePagination(),
    controller.getAll,
);

router.get(
    "/:id",
    requirePermission(PermissionModule.ENQUIRY, PermissionAction.READ),
    validateId,
    controller.getById,
);

router.put(
    "/:id",
    requirePermission(PermissionModule.ENQUIRY, PermissionAction.UPDATE),
    validateId,
    controller.update,
);

router.post(
    "/:id/assign",
    requirePermission(PermissionModule.ENQUIRY, PermissionAction.ASSIGN),
    validateId,
    controller.assign,
);

router.post(
    "/:id/convert",
    requirePermission(PermissionModule.ENQUIRY, PermissionAction.UPDATE),
    validateId,
    controller.convertToClient,
);

router.delete(
    "/:id",
    requirePermission(PermissionModule.ENQUIRY, PermissionAction.DELETE),
    validateId,
    controller.delete,
);

// Follow-ups sub-routes
router.post(
    "/:id/follow-ups",
    requirePermission(PermissionModule.ENQUIRY, PermissionAction.UPDATE),
    validateId,
    controller.addFollowUp,
);

router.get(
    "/:id/follow-ups",
    requirePermission(PermissionModule.ENQUIRY, PermissionAction.READ),
    validateId,
    controller.getFollowUps,
);

export default router;


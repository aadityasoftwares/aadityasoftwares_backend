import { Router } from "express";
import { ClientController } from "../controllers/client.controller.js";
import { authMiddleware } from "../../../middlewares/authmiddleware/auth.middleware.js";
import { requirePermission } from "../../permissions/middlewares/permission.middleware.js";
import { PermissionAction, PermissionModule } from "../../permissions/constants/permission.enums.js";
import { createClientValidation } from "../validations/createClient.validation.js";
import { updateClientValidation } from "../validations/updateClient.validation.js";
import { validateId } from "../../../utils/validations/validateId.validation.js";
import { validatePagination } from "../../../utils/validations/validatePagination.js";

const router = Router();
const controller = new ClientController();

router.use(authMiddleware);

router.post(
    "/",
    requirePermission(PermissionModule.CLIENT, PermissionAction.CREATE),
    createClientValidation,
    controller.create,
);

router.get(
    "/",
    requirePermission(PermissionModule.CLIENT, PermissionAction.READ),
    validatePagination(),
    controller.getAll,
);

router.get(
    "/:id",
    requirePermission(PermissionModule.CLIENT, PermissionAction.READ),
    validateId,
    controller.getById,
);

router.put(
    "/:id",
    requirePermission(PermissionModule.CLIENT, PermissionAction.UPDATE),
    validateId,
    updateClientValidation,
    controller.update,
);

router.delete(
    "/:id",
    requirePermission(PermissionModule.CLIENT, PermissionAction.DELETE),
    validateId,
    controller.delete,
);

export default router;


import { Router } from "express";
import { ExpenseController } from "./expense.controller.js";
import { authMiddleware } from "../../middlewares/authmiddleware/auth.middleware.js";
import { requirePermission } from "../permissions/middlewares/permission.middleware.js";
import { PermissionAction, PermissionModule } from "../permissions/constants/permission.enums.js";
import { validateId } from "../../utils/validations/validateId.validation.js";
import { validatePagination } from "../../utils/validations/validatePagination.js";

const router = Router();
const controller = new ExpenseController();

router.use(authMiddleware);

router.post(
    "/",
    requirePermission(PermissionModule.EXPENSE, PermissionAction.CREATE),
    controller.create,
);

router.get(
    "/",
    requirePermission(PermissionModule.EXPENSE, PermissionAction.READ),
    validatePagination(),
    controller.getAll,
);

router.get(
    "/:id",
    requirePermission(PermissionModule.EXPENSE, PermissionAction.READ),
    validateId,
    controller.getById,
);

router.put(
    "/:id",
    requirePermission(PermissionModule.EXPENSE, PermissionAction.CREATE),
    validateId,
    controller.update,
);

router.delete(
    "/:id",
    requirePermission(PermissionModule.EXPENSE, PermissionAction.CREATE),
    validateId,
    controller.delete,
);

export default router;


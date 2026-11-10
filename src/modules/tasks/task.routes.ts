import { Router } from "express";
import { TaskController } from "./task.controller.js";
import { authMiddleware } from "../../middlewares/authmiddleware/auth.middleware.js";
import { validateId } from "../../utils/validations/validateId.validation.js";
import { validatePagination } from "../../utils/validations/validatePagination.js";

const router = Router();
const controller = new TaskController();

router.use(authMiddleware);

router.post("/", controller.create);
router.get("/", validatePagination(), controller.getAll);
router.get("/:id", validateId, controller.getById);
router.put("/:id", validateId, controller.update);
router.delete("/:id", validateId, controller.delete);

export default router;


import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { PermissionAction, PermissionModule } from "../constants/permission.enums.js";
import { permissionAuthorizationService, type IGlobalAuthorizationContext } from "../services/permissionAuthorization.service.js";
import { AppError } from "../../../utils/errors/app.error.js";

declare global {
    namespace Express {
        interface Locals {
            globalAuth?: IGlobalAuthorizationContext;
        }
    }
}

export interface IRequirePermissionOptions {
    module: PermissionModule | string;
    action: PermissionAction | PermissionAction[];
    scope?: "global";
}

export const requirePermission = (
    moduleOrOptions: PermissionModule | string | IRequirePermissionOptions,
    action?: PermissionAction | PermissionAction[],
) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId || !Types.ObjectId.isValid(userId)) {
                throw new AppError("Unauthorized: Invalid authenticated user", 401);
            }

            const targetModule =
                typeof moduleOrOptions === "object" ? moduleOrOptions.module : moduleOrOptions;
            const targetAction =
                typeof moduleOrOptions === "object" ? moduleOrOptions.action : action!;

            const auth = await permissionAuthorizationService.resolveGlobalAuthorization(userId);
            permissionAuthorizationService.assertPermission(auth, targetModule, targetAction);
            res.locals.globalAuth = auth;
            next();
        } catch (error) {
            next(error);
        }
    };
};

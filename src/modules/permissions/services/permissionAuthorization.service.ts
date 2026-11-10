import { Types } from "mongoose";
import { PermissionModel } from "../models/permission.model.js";
import { RoleModel } from "../../roles/models/role.model.js";
import { PermissionAccess, PermissionAction, PermissionModule } from "../constants/permission.enums.js";
import { PermissionMessages } from "../constants/permission.messages.js";
import { PROTECTED_SYSTEM_ROLE_CODES, SYSTEM_ROLE_CODES } from "../../roles/constants/role.constants.js";
import { RoleMessages } from "../../roles/constants/role.messages.js";
import { AppError } from "../../../utils/errors/app.error.js";
import type { IPermissionDocument } from "../interfaces/permission.interface.js";
import { PermissionRepository } from "../repositories/permission.repository.js";

export interface IResolvedPermission {
    module: string;
    action: PermissionAction;
    access: PermissionAccess;
    code?: string;
    isActive: boolean;
}

export interface IGlobalAuthorizationContext {
    userId: string;
    role?: {
        _id: Types.ObjectId;
        code: string;
        name: string;
        priority: number;
        isSystem: boolean;
    };
    permissions: IResolvedPermission[];
}

export class PermissionAuthorizationService {
    async resolveGlobalAuthorization(userId: string): Promise<IGlobalAuthorizationContext> {
        if (!Types.ObjectId.isValid(userId)) throw new AppError("Invalid authenticated user.", 401);
        const role = await new PermissionRepository().findUserGlobalRole(userId);

        if (!role) throw new AppError(PermissionMessages.FORBIDDEN, 403, "FORBIDDEN");
        return {
            userId,
            role: {
                _id: role._id as Types.ObjectId,
                code: role.code,
                name: role.name,
                priority: role.priority ?? 0,
                isSystem: role.isSystem ?? false,
            },
            permissions: (role.permissions || []).map((p: any) => ({
                module: String(p.module).toUpperCase(),
                action: p.action,
                access: p.access,
                code: p.code,
                isActive: p.isActive !== false,
            })),
        };
    }

    /**
     * Checks if the authorization context grants the requested permission.
     */
    checkPermission(
        auth: Pick<IGlobalAuthorizationContext, "permissions">,
        module: string,
        action: PermissionAction | PermissionAction[],
    ): { granted: boolean; access: PermissionAccess | null } {
        const targetModule = module.toUpperCase();
        const targetActions = Array.isArray(action) ? action : [action];

        const matching = auth.permissions.filter(
            (p) => p.isActive && p.module === targetModule && targetActions.includes(p.action),
        );

        if (matching.length === 0) {
            return { granted: false, access: null };
        }

        if (matching.some((p) => p.access === PermissionAccess.ANY)) {
            return { granted: true, access: PermissionAccess.ANY };
        }
        if (matching.some((p) => p.access === PermissionAccess.OWN)) {
            return { granted: true, access: PermissionAccess.OWN };
        }
        return { granted: true, access: PermissionAccess.GENERAL };
    }

    /**
     * Asserts that the authorization context contains the required permission.
     * Throws 403 Forbidden if not satisfied.
     */
    assertPermission(
        auth: Pick<IGlobalAuthorizationContext, "permissions">,
        module: string,
        action: PermissionAction | PermissionAction[],
        customMessage?: string,
    ): PermissionAccess {
        const { granted, access } = this.checkPermission(auth, module, action);
        if (!granted || !access) {
            throw new AppError(customMessage || PermissionMessages.FORBIDDEN, 403, "FORBIDDEN");
        }
        return access;
    }

    /**
     * Validates that the actor's role priority allows assigning the target role.
     */
    assertCanAssignRole(
        actorAuth: IGlobalAuthorizationContext,
        targetRole: { priority?: number; code?: string; isSystem?: boolean },
    ): void {
        const actorPriority = actorAuth.role?.priority ?? 0;
        const targetPriority = targetRole.priority ?? 0;

        if (targetPriority >= actorPriority && actorAuth.role?.code !== SYSTEM_ROLE_CODES.SUPER_ADMIN) {
            throw new AppError("Cannot assign a role with equal or higher priority than your own.", 403, "FORBIDDEN");
        }
    }

    /**
     * Validates that the actor has permission to modify or delete the target role.
     */
    assertCanManageRole(
        actorAuth: IGlobalAuthorizationContext,
        targetRole: { priority?: number; code?: string; isSystem?: boolean },
    ): void {
        if (targetRole.isSystem || (targetRole.code && PROTECTED_SYSTEM_ROLE_CODES.has(targetRole.code))) {
            throw new AppError(RoleMessages.SYSTEM_ROLE_UPDATE, 403, "FORBIDDEN");
        }

        const actorPriority = actorAuth.role?.priority ?? 0;
        const targetPriority = targetRole.priority ?? 0;

        if (targetPriority >= actorPriority && actorAuth.role?.code !== SYSTEM_ROLE_CODES.SUPER_ADMIN) {
            throw new AppError("Cannot manage a role with equal or higher priority than your own.", 403, "FORBIDDEN");
        }
    }
}

export const permissionAuthorizationService = new PermissionAuthorizationService();

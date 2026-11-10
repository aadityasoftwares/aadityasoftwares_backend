import type { Types } from "mongoose";
import { PermissionModel } from "../../permissions/models/permission.model.js";
import { RoleScope, RoleType } from "../constants/role.enums.js";
import { SYSTEM_ROLE_CODES, SYSTEM_ROLE_PERMISSIONS } from "../constants/role.constants.js";
import { RoleModel } from "../models/role.model.js";

interface SystemRoleSeed {
    name: string;
    displayName: string;
    code: string;
    description: string;
    type: RoleType;
    scope: RoleScope;
    permissions: Types.ObjectId[];
    isSystem: true;
    isDefault: boolean;
    priority: number;
    isActive: true;
}

export const seedRoles = async (): Promise<void> => {
    const activePermissions = await PermissionModel.find({ isActive: true })
        .select("_id code")
        .lean();

    const permissionMap = new Map<string, Types.ObjectId>();
    for (const permission of activePermissions) {
        permissionMap.set(permission.code, permission._id);
    }

    const getPermissionIds = (codes: readonly string[]) => {
        return codes.map((code) => permissionMap.get(code)).filter((id): id is Types.ObjectId => !!id);
    };

    const superAdminPermissions = activePermissions.map((p) => p._id);
    const adminPermissions = getPermissionIds(SYSTEM_ROLE_PERMISSIONS[SYSTEM_ROLE_CODES.ADMIN]);
    const managerPermissions = getPermissionIds(SYSTEM_ROLE_PERMISSIONS[SYSTEM_ROLE_CODES.MANAGER]);
    const employeePermissions = getPermissionIds(SYSTEM_ROLE_PERMISSIONS[SYSTEM_ROLE_CODES.EMPLOYEE]);

    const systemRoles: SystemRoleSeed[] = [
        {
            name: "super_admin",
            displayName: "Super Administrator",
            code: SYSTEM_ROLE_CODES.SUPER_ADMIN,
            description: "Full system-level access to all Aaditya Softwares modules.",
            type: RoleType.SYSTEM,
            scope: RoleScope.GLOBAL,
            permissions: superAdminPermissions,
            isSystem: true,
            isDefault: false,
            priority: 1000,
            isActive: true,
        },
        {
            name: "admin",
            displayName: "Administrator",
            code: SYSTEM_ROLE_CODES.ADMIN,
            description: "Administrative access across business operations and management.",
            type: RoleType.SYSTEM,
            scope: RoleScope.GLOBAL,
            permissions: adminPermissions,
            isSystem: true,
            isDefault: false,
            priority: 800,
            isActive: true,
        },
        {
            name: "manager",
            displayName: "Manager",
            code: SYSTEM_ROLE_CODES.MANAGER,
            description: "Managerial access for managing clients, leads, invoices and sales.",
            type: RoleType.SYSTEM,
            scope: RoleScope.GLOBAL,
            permissions: managerPermissions,
            isSystem: true,
            isDefault: false,
            priority: 500,
            isActive: true,
        },
        {
            name: "employee",
            displayName: "Employee",
            code: SYSTEM_ROLE_CODES.EMPLOYEE,
            description: "Staff access for enquiries, assigned tasks and expense submissions.",
            type: RoleType.SYSTEM,
            scope: RoleScope.GLOBAL,
            permissions: employeePermissions,
            isSystem: true,
            isDefault: true,
            priority: 200,
            isActive: true,
        },
    ];

    for (const role of systemRoles) {
        await RoleModel.findOneAndUpdate(
            { code: role.code, scope: RoleScope.GLOBAL },
            {
                $set: {
                    name: role.name,
                    displayName: role.displayName,
                    description: role.description,
                    type: role.type,
                    scope: role.scope,
                    permissions: role.permissions,
                    isSystem: true,
                    isDefault: role.isDefault,
                    priority: role.priority,
                    isActive: true,
                    workspaceId: null,
                },
            },
            { upsert: true, new: true },
        );
    }

    console.log("System roles seeded successfully for Aaditya Softwares.");
};

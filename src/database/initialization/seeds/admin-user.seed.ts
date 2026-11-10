import { UserModel } from "../../../modules/user/models/user.model.js";
import { RoleModel } from "../../../modules/roles/models/role.model.js";
import { UserProfileModel } from "../../../modules/userprofile/models/userProfile.model.js";
import { SYSTEM_ROLE_CODES } from "../../../modules/roles/constants/role.constants.js";
import { UserAuthProvider, UserStatus } from "../../../modules/user/constants/user.enums.js";
import bcrypt from "bcryptjs";

export const executeAdminUserSeed = async (): Promise<void> => {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@aadityasoftwares.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";

    const existingAdmin = await UserModel.findOne({ email: adminEmail }).lean();
    if (existingAdmin) {
        return;
    }

    const superAdminRole = await RoleModel.findOne({ code: SYSTEM_ROLE_CODES.SUPER_ADMIN }).lean();
    if (!superAdminRole) {
        console.warn("Cannot seed admin user: SUPER_ADMIN role not found.");
        return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = await UserModel.create({
        email: adminEmail,
        password: hashedPassword,
        globalRoleId: superAdminRole._id,
        status: UserStatus.ACTIVE,
        authProvider: UserAuthProvider.LOCAL,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
    });

    await UserProfileModel.create({
        userId: adminUser._id,
        firstName: "Super",
        lastName: "Admin",
        displayName: "Super Admin",
    });

    console.log(`Default Super Admin user seeded successfully (${adminEmail}).`);
};


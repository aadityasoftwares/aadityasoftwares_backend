import { executeLanguagesSeed } from "./seeds/languages.seed.js";
import { executeCountriesSeed } from "./seeds/countries.seed.js";
import { executeCurrenciesSeed } from "./seeds/currencies.seed.js";
import { executeTimezonesSeed } from "./seeds/timezones.seed.js";
import { executeSystemSettingsSeed } from "./seeds/system-settings.seed.js";
import { executePermissionsSeed } from "./seeds/permissions.seed.js";
import { executeRolesSeed } from "./seeds/roles.seed.js";
import { executeAdminUserSeed } from "./seeds/admin-user.seed.js";
import { executeBlogWebsitesSeed, INITIAL_BLOG_WEBSITES } from "./seeds/blog-websites.seed.js";

import { LanguageModel } from "../../modules/languages/models/language.model.js";
import { LanguageCode } from "../../modules/languages/constants/language.enums.js";
import { CountryModel } from "../../modules/countries/models/country.model.js";
import { CountryCode } from "../../modules/countries/constants/country.enums.js";
import { CurrencyModel } from "../../modules/currency/models/currency.model.js";
import { CurrencyCode } from "../../modules/currency/constants/currency.enums.js";
import { TimezoneModel } from "../../modules/timezones/models/timezone.model.js";
import { SystemSettingModel } from "../../modules/systemsettings/models/systemSetting.model.js";
import { SYSTEM_SETTING_DEFAULTS } from "../../modules/systemsettings/constants/systemSetting.constants.js";
import { PermissionModel } from "../../modules/permissions/models/permission.model.js";
import { PERMISSION_DEFINITIONS } from "../../modules/permissions/constants/permission.constants.js";
import { RoleModel } from "../../modules/roles/models/role.model.js";
import { SYSTEM_ROLE_CODES } from "../../modules/roles/constants/role.constants.js";
import { UserModel } from "../../modules/user/models/user.model.js";
import { BlogWebsiteModel } from "../../modules/blogs/models/blogWebsite.model.js";

export interface ISeedStep {
    id: string;
    name: string;
    description: string;
    execute: () => Promise<void>;
}

export interface IVerificationResult {
    valid: boolean;
    errors: string[];
    details: Record<string, { count: number; expected?: number; valid: boolean }>;
}

export const SEED_REGISTRY: readonly ISeedStep[] = [
    {
        id: "languages",
        name: "Languages",
        description: "Default platform languages (English)",
        execute: executeLanguagesSeed,
    },
    {
        id: "countries",
        name: "Countries",
        description: "Default platform countries (India)",
        execute: executeCountriesSeed,
    },
    {
        id: "currencies",
        name: "Currencies",
        description: "Default platform currencies (INR)",
        execute: executeCurrenciesSeed,
    },
    {
        id: "timezones",
        name: "Timezones",
        description: "Default platform timezones (Asia/Kolkata)",
        execute: executeTimezonesSeed,
    },
    {
        id: "system-settings",
        name: "System Settings",
        description: "Essential platform configuration and company defaults",
        execute: executeSystemSettingsSeed,
    },
    {
        id: "permissions",
        name: "Permissions",
        description: "System permissions definitions and access controls",
        execute: executePermissionsSeed,
    },
    {
        id: "roles",
        name: "Roles",
        description: "Core system roles with resolved permission mappings",
        execute: executeRolesSeed,
    },
    {
        id: "admin-user",
        name: "Super Admin User",
        description: "Default super administrator user account",
        execute: executeAdminUserSeed,
    },
    {
        id: "blog-websites",
        name: "Blog Websites",
        description: "Initial blog websites (Aaditya Softwares & StickyJi)",
        execute: executeBlogWebsitesSeed,
    },
] as const;

export async function verifyDatabaseInitialization(): Promise<IVerificationResult> {
    const errors: string[] = [];
    const details: IVerificationResult["details"] = {};

    // 1. Languages
    const languageCount = await LanguageModel.countDocuments({
        code: LanguageCode.ENGLISH,
        isDefault: true,
        isActive: true,
    });
    details.languages = { count: languageCount, expected: 1, valid: languageCount >= 1 };
    if (!details.languages.valid) {
        errors.push("Missing default English language.");
    }

    // 2. Countries
    const countryCount = await CountryModel.countDocuments({
        code: CountryCode.INDIA,
        isDefault: true,
        isActive: true,
    });
    details.countries = { count: countryCount, expected: 1, valid: countryCount >= 1 };
    if (!details.countries.valid) {
        errors.push("Missing default India country record.");
    }

    // 3. Currencies
    const currencyCount = await CurrencyModel.countDocuments({
        code: CurrencyCode.INR,
        isDefault: true,
        isActive: true,
    });
    details.currencies = { count: currencyCount, expected: 1, valid: currencyCount >= 1 };
    if (!details.currencies.valid) {
        errors.push("Missing default INR currency record.");
    }

    // 4. Timezones
    const timezoneCount = await TimezoneModel.countDocuments({
        isDefault: true,
        isActive: true,
    });
    details.timezones = { count: timezoneCount, expected: 1, valid: timezoneCount >= 1 };
    if (!details.timezones.valid) {
        errors.push("Missing default timezone record.");
    }

    // 5. System Settings
    const settingCount = await SystemSettingModel.countDocuments({
        key: { $in: SYSTEM_SETTING_DEFAULTS.map((s) => s.key) },
    });
    details.systemSettings = {
        count: settingCount,
        expected: SYSTEM_SETTING_DEFAULTS.length,
        valid: settingCount >= SYSTEM_SETTING_DEFAULTS.length,
    };
    if (!details.systemSettings.valid) {
        errors.push(`Missing system settings. Found ${settingCount}/${SYSTEM_SETTING_DEFAULTS.length}`);
    }

    // 6. Permissions
    const permissionCount = await PermissionModel.countDocuments({
        code: { $in: PERMISSION_DEFINITIONS.map((p) => p.code) },
        isActive: true,
    });
    details.permissions = {
        count: permissionCount,
        expected: PERMISSION_DEFINITIONS.length,
        valid: permissionCount >= PERMISSION_DEFINITIONS.length,
    };
    if (!details.permissions.valid) {
        errors.push(`Missing permissions. Found ${permissionCount}/${PERMISSION_DEFINITIONS.length}`);
    }

    // 7. Roles
    const roleCount = await RoleModel.countDocuments({
        code: { $in: Object.values(SYSTEM_ROLE_CODES) },
        isActive: true,
    });
    details.roles = {
        count: roleCount,
        expected: Object.values(SYSTEM_ROLE_CODES).length,
        valid: roleCount >= Object.values(SYSTEM_ROLE_CODES).length,
    };
    if (!details.roles.valid) {
        errors.push(`Missing system roles. Found ${roleCount}/${Object.values(SYSTEM_ROLE_CODES).length}`);
    }

    // 8. Admin User
    const adminUser = await UserModel.findOne({ email: process.env.ADMIN_EMAIL || "admin@aadityasoftwares.com" });
    details.adminUser = { count: adminUser ? 1 : 0, expected: 1, valid: !!adminUser };
    if (!details.adminUser.valid) {
        errors.push("Missing default super administrator user.");
    }

    // 9. Blog Websites
    const websiteCount = await BlogWebsiteModel.countDocuments({
        slug: { $in: INITIAL_BLOG_WEBSITES.map((w) => w.slug) },
    });
    details.blogWebsites = {
        count: websiteCount,
        expected: INITIAL_BLOG_WEBSITES.length,
        valid: websiteCount >= INITIAL_BLOG_WEBSITES.length,
    };
    if (!details.blogWebsites.valid) {
        errors.push(`Missing initial blog websites. Found ${websiteCount}/${INITIAL_BLOG_WEBSITES.length}`);
    }

    return {
        valid: errors.length === 0,
        errors,
        details,
    };
}

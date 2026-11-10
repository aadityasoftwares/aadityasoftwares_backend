import { PermissionAccess, PermissionAction, PermissionModule } from "./permission.enums.js";

export const DEFAULT_PERMISSION_STATUS = true;

export const PERMISSION_CODES = {
    // Client Management
    CLIENT_VIEW: "CLIENT_VIEW",
    CLIENT_CREATE: "CLIENT_CREATE",
    CLIENT_UPDATE: "CLIENT_UPDATE",
    CLIENT_DELETE: "CLIENT_DELETE",

    // Enquiry Management
    ENQUIRY_VIEW: "ENQUIRY_VIEW",
    ENQUIRY_CREATE: "ENQUIRY_CREATE",
    ENQUIRY_UPDATE: "ENQUIRY_UPDATE",
    ENQUIRY_ASSIGN: "ENQUIRY_ASSIGN",
    ENQUIRY_DELETE: "ENQUIRY_DELETE",

    // Quotation Management
    QUOTATION_VIEW: "QUOTATION_VIEW",
    QUOTATION_CREATE: "QUOTATION_CREATE",
    QUOTATION_UPDATE: "QUOTATION_UPDATE",

    // Invoice Management
    INVOICE_VIEW: "INVOICE_VIEW",
    INVOICE_CREATE: "INVOICE_CREATE",
    INVOICE_UPDATE: "INVOICE_UPDATE",
    INVOICE_CANCEL: "INVOICE_CANCEL",

    // Payment Management
    PAYMENT_VIEW: "PAYMENT_VIEW",
    PAYMENT_CREATE: "PAYMENT_CREATE",
    PAYMENT_REVERSE: "PAYMENT_REVERSE",

    // Expense Management
    EXPENSE_VIEW: "EXPENSE_VIEW",
    EXPENSE_CREATE: "EXPENSE_CREATE",

    // Reports
    REPORT_VIEW: "REPORT_VIEW",

    // Administration
    USER_MANAGE: "USER_MANAGE",
    ROLE_MANAGE: "ROLE_MANAGE",
    SYSTEM_SETTINGS_MANAGE: "SYSTEM_SETTINGS_MANAGE",
} as const;

export interface PermissionDefinition {
    name: string;
    displayName: string;
    code: string;
    module: PermissionModule;
    action: PermissionAction;
    access: PermissionAccess;
    description: string;
    sortOrder: number;
}

export const PERMISSION_DEFINITIONS: readonly PermissionDefinition[] = [
    // Client
    {
        name: "client_view",
        displayName: "View Clients",
        code: PERMISSION_CODES.CLIENT_VIEW,
        module: PermissionModule.CLIENT,
        action: PermissionAction.READ,
        access: PermissionAccess.GENERAL,
        description: "Allows viewing client profiles and lists.",
        sortOrder: 100,
    },
    {
        name: "client_create",
        displayName: "Create Clients",
        code: PERMISSION_CODES.CLIENT_CREATE,
        module: PermissionModule.CLIENT,
        action: PermissionAction.CREATE,
        access: PermissionAccess.GENERAL,
        description: "Allows adding new clients.",
        sortOrder: 110,
    },
    {
        name: "client_update",
        displayName: "Update Clients",
        code: PERMISSION_CODES.CLIENT_UPDATE,
        module: PermissionModule.CLIENT,
        action: PermissionAction.UPDATE,
        access: PermissionAccess.GENERAL,
        description: "Allows editing client profiles.",
        sortOrder: 120,
    },
    {
        name: "client_delete",
        displayName: "Delete Clients",
        code: PERMISSION_CODES.CLIENT_DELETE,
        module: PermissionModule.CLIENT,
        action: PermissionAction.DELETE,
        access: PermissionAccess.GENERAL,
        description: "Allows deleting clients.",
        sortOrder: 130,
    },

    // Enquiry
    {
        name: "enquiry_view",
        displayName: "View Enquiries",
        code: PERMISSION_CODES.ENQUIRY_VIEW,
        module: PermissionModule.ENQUIRY,
        action: PermissionAction.READ,
        access: PermissionAccess.GENERAL,
        description: "Allows viewing sales enquiries and leads.",
        sortOrder: 200,
    },
    {
        name: "enquiry_create",
        displayName: "Create Enquiries",
        code: PERMISSION_CODES.ENQUIRY_CREATE,
        module: PermissionModule.ENQUIRY,
        action: PermissionAction.CREATE,
        access: PermissionAccess.GENERAL,
        description: "Allows creating new enquiries.",
        sortOrder: 210,
    },
    {
        name: "enquiry_update",
        displayName: "Update Enquiries",
        code: PERMISSION_CODES.ENQUIRY_UPDATE,
        module: PermissionModule.ENQUIRY,
        action: PermissionAction.UPDATE,
        access: PermissionAccess.GENERAL,
        description: "Allows updating enquiry details and follow-ups.",
        sortOrder: 220,
    },
    {
        name: "enquiry_assign",
        displayName: "Assign Enquiries",
        code: PERMISSION_CODES.ENQUIRY_ASSIGN,
        module: PermissionModule.ENQUIRY,
        action: PermissionAction.ASSIGN,
        access: PermissionAccess.GENERAL,
        description: "Allows assigning enquiries to employees.",
        sortOrder: 230,
    },
    {
        name: "enquiry_delete",
        displayName: "Delete Enquiries",
        code: PERMISSION_CODES.ENQUIRY_DELETE,
        module: PermissionModule.ENQUIRY,
        action: PermissionAction.DELETE,
        access: PermissionAccess.GENERAL,
        description: "Allows removing enquiries.",
        sortOrder: 240,
    },

    // Quotation
    {
        name: "quotation_view",
        displayName: "View Quotations",
        code: PERMISSION_CODES.QUOTATION_VIEW,
        module: PermissionModule.QUOTATION,
        action: PermissionAction.READ,
        access: PermissionAccess.GENERAL,
        description: "Allows viewing quotations.",
        sortOrder: 300,
    },
    {
        name: "quotation_create",
        displayName: "Create Quotations",
        code: PERMISSION_CODES.QUOTATION_CREATE,
        module: PermissionModule.QUOTATION,
        action: PermissionAction.CREATE,
        access: PermissionAccess.GENERAL,
        description: "Allows creating quotations.",
        sortOrder: 310,
    },
    {
        name: "quotation_update",
        displayName: "Update Quotations",
        code: PERMISSION_CODES.QUOTATION_UPDATE,
        module: PermissionModule.QUOTATION,
        action: PermissionAction.UPDATE,
        access: PermissionAccess.GENERAL,
        description: "Allows editing quotations.",
        sortOrder: 320,
    },

    // Invoice
    {
        name: "invoice_view",
        displayName: "View Invoices",
        code: PERMISSION_CODES.INVOICE_VIEW,
        module: PermissionModule.INVOICE,
        action: PermissionAction.READ,
        access: PermissionAccess.GENERAL,
        description: "Allows viewing invoices.",
        sortOrder: 400,
    },
    {
        name: "invoice_create",
        displayName: "Create Invoices",
        code: PERMISSION_CODES.INVOICE_CREATE,
        module: PermissionModule.INVOICE,
        action: PermissionAction.CREATE,
        access: PermissionAccess.GENERAL,
        description: "Allows generating invoices.",
        sortOrder: 410,
    },
    {
        name: "invoice_update",
        displayName: "Update Invoices",
        code: PERMISSION_CODES.INVOICE_UPDATE,
        module: PermissionModule.INVOICE,
        action: PermissionAction.UPDATE,
        access: PermissionAccess.GENERAL,
        description: "Allows modifying invoice items and details.",
        sortOrder: 420,
    },
    {
        name: "invoice_cancel",
        displayName: "Cancel Invoices",
        code: PERMISSION_CODES.INVOICE_CANCEL,
        module: PermissionModule.INVOICE,
        action: PermissionAction.CANCEL,
        access: PermissionAccess.GENERAL,
        description: "Allows cancelling invoices.",
        sortOrder: 430,
    },

    // Payment
    {
        name: "payment_view",
        displayName: "View Payments",
        code: PERMISSION_CODES.PAYMENT_VIEW,
        module: PermissionModule.PAYMENT,
        action: PermissionAction.READ,
        access: PermissionAccess.GENERAL,
        description: "Allows viewing payment records.",
        sortOrder: 500,
    },
    {
        name: "payment_create",
        displayName: "Create Payments",
        code: PERMISSION_CODES.PAYMENT_CREATE,
        module: PermissionModule.PAYMENT,
        action: PermissionAction.CREATE,
        access: PermissionAccess.GENERAL,
        description: "Allows recording payments received.",
        sortOrder: 510,
    },
    {
        name: "payment_reverse",
        displayName: "Reverse Payments",
        code: PERMISSION_CODES.PAYMENT_REVERSE,
        module: PermissionModule.PAYMENT,
        action: PermissionAction.REVERSE,
        access: PermissionAccess.GENERAL,
        description: "Allows reversing recorded payments.",
        sortOrder: 520,
    },

    // Expense
    {
        name: "expense_view",
        displayName: "View Expenses",
        code: PERMISSION_CODES.EXPENSE_VIEW,
        module: PermissionModule.EXPENSE,
        action: PermissionAction.READ,
        access: PermissionAccess.GENERAL,
        description: "Allows viewing expense records.",
        sortOrder: 600,
    },
    {
        name: "expense_create",
        displayName: "Create Expenses",
        code: PERMISSION_CODES.EXPENSE_CREATE,
        module: PermissionModule.EXPENSE,
        action: PermissionAction.CREATE,
        access: PermissionAccess.GENERAL,
        description: "Allows adding company expenses.",
        sortOrder: 610,
    },

    // Reports
    {
        name: "report_view",
        displayName: "View Reports",
        code: PERMISSION_CODES.REPORT_VIEW,
        module: PermissionModule.REPORT,
        action: PermissionAction.READ,
        access: PermissionAccess.GENERAL,
        description: "Allows accessing business intelligence and GST reports.",
        sortOrder: 700,
    },

    // Administration
    {
        name: "user_manage",
        displayName: "Manage Users",
        code: PERMISSION_CODES.USER_MANAGE,
        module: PermissionModule.USER,
        action: PermissionAction.MANAGE,
        access: PermissionAccess.GENERAL,
        description: "Allows managing user accounts and credentials.",
        sortOrder: 800,
    },
    {
        name: "role_manage",
        displayName: "Manage Roles",
        code: PERMISSION_CODES.ROLE_MANAGE,
        module: PermissionModule.ROLES,
        action: PermissionAction.MANAGE,
        access: PermissionAccess.GENERAL,
        description: "Allows managing roles and permission assignments.",
        sortOrder: 810,
    },
    {
        name: "system_settings_manage",
        displayName: "Manage System Settings",
        code: PERMISSION_CODES.SYSTEM_SETTINGS_MANAGE,
        module: PermissionModule.SYSTEM_SETTINGS,
        action: PermissionAction.MANAGE,
        access: PermissionAccess.GENERAL,
        description: "Allows managing global platform and company settings.",
        sortOrder: 820,
    },
] as const;

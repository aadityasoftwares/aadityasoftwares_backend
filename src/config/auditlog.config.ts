import { AuditLogAction } from "../modules/auditlog/constants/auditLog.enums.js";
import { AppModule } from "../utils/enums/appModule.enums.js";

export interface IAuditLogModuleConfig {
    resourceType: string;
    actions: AuditLogAction[];
}

export const AuditLogConfig: Partial<Record<AppModule, IAuditLogModuleConfig>> = {
    [AppModule.AUTH]: {
        resourceType: "Authentication",
        actions: [
            AuditLogAction.REGISTER,
            AuditLogAction.LOGIN,
            AuditLogAction.LOGOUT,
            AuditLogAction.LOGOUT_ALL,
            AuditLogAction.LOGIN_FAILED,
            AuditLogAction.PASSWORD_CHANGED,
            AuditLogAction.PASSWORD_RESET,
            AuditLogAction.PASSWORD_RESET_REQUESTED,
            AuditLogAction.EMAIL_VERIFIED,
            AuditLogAction.PHONE_VERIFIED,
            AuditLogAction.MFA_ENABLED,
            AuditLogAction.MFA_DISABLED,
        ],
    },

    [AppModule.USER]: {
        resourceType: "User",
        actions: [
            AuditLogAction.CREATE,
            AuditLogAction.UPDATE,
            AuditLogAction.DELETE,
            AuditLogAction.RESTORE,
            AuditLogAction.STATUS_CHANGE,
            AuditLogAction.ROLE_ASSIGNED,
        ],
    },

    [AppModule.ROLE]: {
        resourceType: "Role",
        actions: [AuditLogAction.CREATE, AuditLogAction.UPDATE, AuditLogAction.DELETE, AuditLogAction.PERMISSION_ASSIGNED, AuditLogAction.PERMISSION_REVOKED],
    },

    [AppModule.PERMISSION]: {
        resourceType: "Permission",
        actions: [AuditLogAction.CREATE, AuditLogAction.UPDATE, AuditLogAction.DELETE, AuditLogAction.STATUS_CHANGE],
    },

    [AppModule.SYSTEM_SETTING]: {
        resourceType: "SystemSetting",
        actions: [AuditLogAction.CREATE, AuditLogAction.UPDATE, AuditLogAction.DELETE, AuditLogAction.SETTINGS_UPDATED, AuditLogAction.RESET],
    },

    [AppModule.CLIENT]: {
        resourceType: "Client",
        actions: [AuditLogAction.CREATE, AuditLogAction.UPDATE, AuditLogAction.DELETE, AuditLogAction.STATUS_CHANGE],
    },

    [AppModule.ENQUIRY]: {
        resourceType: "Enquiry",
        actions: [AuditLogAction.CREATE, AuditLogAction.UPDATE, AuditLogAction.DELETE, AuditLogAction.STATUS_CHANGE, AuditLogAction.ASSIGN, AuditLogAction.CONVERTED],
    },

    [AppModule.ENQUIRY_FOLLOW_UP]: {
        resourceType: "EnquiryFollowUp",
        actions: [AuditLogAction.CREATE, AuditLogAction.UPDATE, AuditLogAction.DELETE, AuditLogAction.COMPLETE],
    },

    [AppModule.QUOTATION]: {
        resourceType: "Quotation",
        actions: [AuditLogAction.CREATE, AuditLogAction.UPDATE, AuditLogAction.DELETE, AuditLogAction.STATUS_CHANGE, AuditLogAction.CONVERTED],
    },

    [AppModule.INVOICE]: {
        resourceType: "Invoice",
        actions: [AuditLogAction.CREATE, AuditLogAction.UPDATE, AuditLogAction.STATUS_CHANGE, AuditLogAction.CANCEL],
    },

    [AppModule.PAYMENT]: {
        resourceType: "Payment",
        actions: [AuditLogAction.CREATE, AuditLogAction.PAYMENT_RECORDED, AuditLogAction.PAYMENT_REVERSED],
    },

    [AppModule.EXPENSE]: {
        resourceType: "Expense",
        actions: [AuditLogAction.CREATE, AuditLogAction.UPDATE, AuditLogAction.DELETE, AuditLogAction.STATUS_CHANGE],
    },

    [AppModule.TASK]: {
        resourceType: "Task",
        actions: [AuditLogAction.CREATE, AuditLogAction.UPDATE, AuditLogAction.DELETE, AuditLogAction.ASSIGN, AuditLogAction.STATUS_CHANGE, AuditLogAction.COMPLETE],
    },
};


export enum PermissionAction {
    CREATE = "CREATE",
    READ = "READ",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    MANAGE = "MANAGE",
    ASSIGN = "ASSIGN",
    CANCEL = "CANCEL",
    REVERSE = "REVERSE",
    PUBLISH = "PUBLISH",
}

export enum PermissionAccess {
    GENERAL = "GENERAL",
    OWN = "OWN",
    ANY = "ANY",
}

export enum PermissionModule {
    CLIENT = "CLIENT",
    ENQUIRY = "ENQUIRY",
    QUOTATION = "QUOTATION",
    INVOICE = "INVOICE",
    PAYMENT = "PAYMENT",
    EXPENSE = "EXPENSE",
    REPORT = "REPORT",
    USER = "USER",
    ROLES = "ROLES",
    SYSTEM_SETTINGS = "SYSTEM_SETTINGS",
    TASKS = "TASKS",
    BLOG = "BLOG",
}

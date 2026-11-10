import { Router } from "express";
import { savePerformanceModule } from "../utils/savePerformance.util.js";

// Foundation & Access Management
import authRoutes from "../modules/auth/routes/auth.routes.js";
import userRoutes from "../modules/user/routes/user.routes.js";
import userProfileRoutes from "../modules/userprofile/routes/userProfile.routes.js";
import userPreferenceRoutes from "../modules/userpreference/routes/userPreference.routes.js";
import roleRoutes from "../modules/roles/routes/role.routes.js";
import permissionRoutes from "../modules/permissions/routes/permission.routes.js";

// Master Data & Media
import countryRoutes from "../modules/countries/routes/country.routes.js";
import currencyRoutes from "../modules/currency/routes/currency.routes.js";
import languageRoutes from "../modules/languages/routes/language.routes.js";
import timezoneRoutes from "../modules/timezones/routes/timezone.routes.js";
import systemSettingRoutes from "../modules/systemsettings/routes/systemSetting.routes.js";
import mediaRoutes from "../modules/media/routes/media.routes.js";
import auditLogRoutes from "../modules/auditlog/routes/auditLog.routes.js";

// Business Modules
import clientRoutes from "../modules/clients/routes/client.routes.js";
import enquiryRoutes from "../modules/enquiries/routes/enquiry.routes.js";
import quotationRoutes from "../modules/quotations/routes/quotation.routes.js";
import invoiceRoutes from "../modules/invoices/routes/invoice.routes.js";
import paymentRoutes from "../modules/payments/routes/payment.routes.js";
import taskRoutes from "../modules/tasks/task.routes.js";
import expenseRoutes from "../modules/expenses/expense.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";
import reportRoutes from "../modules/reports/report.routes.js";

const router = Router();

// Foundation
router.use("/auth", savePerformanceModule("auth"), authRoutes);
router.use("/user", savePerformanceModule("user"), userRoutes);
router.use("/userprofile", savePerformanceModule("userprofile"), userProfileRoutes);
router.use("/userpreference", savePerformanceModule("userpreference"), userPreferenceRoutes);
router.use("/roles", savePerformanceModule("roles"), roleRoutes);
router.use("/permissions", savePerformanceModule("permissions"), permissionRoutes);

// Master Data & Shared
router.use("/countries", savePerformanceModule("countries"), countryRoutes);
router.use("/currencies", savePerformanceModule("currencies"), currencyRoutes);
router.use("/languages", savePerformanceModule("languages"), languageRoutes);
router.use("/timezones", savePerformanceModule("timezones"), timezoneRoutes);
router.use("/systemsettings", savePerformanceModule("systemsettings"), systemSettingRoutes);
router.use("/media", savePerformanceModule("media"), mediaRoutes);
router.use("/auditlogs", savePerformanceModule("auditlogs"), auditLogRoutes);

// Aaditya Softwares Business Modules
router.use("/clients", savePerformanceModule("clients"), clientRoutes);
router.use("/enquiries", savePerformanceModule("enquiries"), enquiryRoutes);
router.use("/quotations", savePerformanceModule("quotations"), quotationRoutes);
router.use("/invoices", savePerformanceModule("invoices"), invoiceRoutes);
router.use("/payments", savePerformanceModule("payments"), paymentRoutes);
router.use("/tasks", savePerformanceModule("tasks"), taskRoutes);
router.use("/expenses", savePerformanceModule("expenses"), expenseRoutes);
router.use("/dashboard", savePerformanceModule("dashboard"), dashboardRoutes);
router.use("/reports", savePerformanceModule("reports"), reportRoutes);

export default router;


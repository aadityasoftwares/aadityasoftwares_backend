import { ClientModel } from "../clients/models/client.model.js";
import { EnquiryModel } from "../enquiries/models/enquiry.model.js";
import { EnquiryStatus } from "../enquiries/constants/enquiry.enums.js";
import { QuotationModel } from "../quotations/models/quotation.model.js";
import { InvoiceModel } from "../invoices/models/invoice.model.js";
import { InvoiceStatus } from "../invoices/constants/invoice.enums.js";
import { PaymentModel } from "../payments/models/payment.model.js";
import { PaymentStatus } from "../payments/constants/payment.enums.js";
import { TaskModel } from "../tasks/models/task.model.js";
import { TaskStatus } from "../tasks/models/task.model.js";
import { AuditLogModel } from "../auditlog/models/auditLog.model.js";

export class DashboardService {
    async getMetrics() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalClients,
            totalEnquiries,
            newEnquiriesThisMonth,
            wonEnquiries,
            lostEnquiries,
            totalQuotations,
            totalInvoices,
            paidInvoices,
            overdueInvoices,
            financialTotals,
            monthlyRevenueAgg,
            upcomingEnquiryFollowUps,
            upcomingTasks,
            recentActivities,
        ] = await Promise.all([
            ClientModel.countDocuments({ isDeleted: { $ne: true } }),
            EnquiryModel.countDocuments({ isDeleted: { $ne: true } }),
            EnquiryModel.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: startOfMonth } }),
            EnquiryModel.countDocuments({ isDeleted: { $ne: true }, status: EnquiryStatus.WON }),
            EnquiryModel.countDocuments({ isDeleted: { $ne: true }, status: EnquiryStatus.LOST }),
            QuotationModel.countDocuments({ isDeleted: { $ne: true } }),
            InvoiceModel.countDocuments({ isDeleted: { $ne: true } }),
            InvoiceModel.countDocuments({ isDeleted: { $ne: true }, status: InvoiceStatus.PAID }),
            InvoiceModel.countDocuments({
                isDeleted: { $ne: true },
                dueDate: { $lt: now },
                status: { $in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
            }),
            InvoiceModel.aggregate([
                { $match: { isDeleted: { $ne: true }, status: { $ne: InvoiceStatus.CANCELLED } } },
                {
                    $group: {
                        _id: null,
                        totalBilled: { $sum: "$grandTotal" },
                        totalCollected: { $sum: "$paidAmount" },
                        totalOutstanding: { $sum: "$outstandingBalance" },
                    },
                },
            ]),
            PaymentModel.aggregate([
                {
                    $match: {
                        status: PaymentStatus.COMPLETED,
                        paymentDate: { $gte: new Date(now.getFullYear(), 0, 1) },
                    },
                },
                {
                    $group: {
                        _id: { $month: "$paymentDate" },
                        total: { $sum: "$amount" },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            EnquiryModel.find({
                isDeleted: { $ne: true },
                followUpDate: { $gte: now },
            })
                .sort({ followUpDate: 1 })
                .limit(5)
                .select("enquiryNumber prospectName followUpDate status")
                .lean()
                .exec(),
            TaskModel.find({
                isDeleted: { $ne: true },
                dueDate: { $gte: now },
                status: { $ne: TaskStatus.COMPLETED },
            })
                .sort({ dueDate: 1 })
                .limit(5)
                .select("title dueDate priority status")
                .lean()
                .exec(),
            AuditLogModel.find({})
                .sort({ timestamp: -1, createdAt: -1 })
                .limit(10)
                .select("action module resourceName description timestamp")
                .lean()
                .exec(),
        ]);

        const financial = financialTotals[0] || { totalBilled: 0, totalCollected: 0, totalOutstanding: 0 };

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyRevenue = monthNames.map((name, index) => {
            const found = monthlyRevenueAgg.find((item) => item._id === index + 1);
            return {
                month: name,
                revenue: found ? Math.round(found.total * 100) / 100 : 0,
            };
        });

        return {
            clients: {
                total: totalClients,
            },
            enquiries: {
                total: totalEnquiries,
                newThisMonth: newEnquiriesThisMonth,
                won: wonEnquiries,
                lost: lostEnquiries,
                conversionRate: totalEnquiries > 0 ? Math.round((wonEnquiries / totalEnquiries) * 100) : 0,
            },
            quotations: {
                total: totalQuotations,
            },
            invoices: {
                total: totalInvoices,
                paid: paidInvoices,
                overdue: overdueInvoices,
                totalBilled: Math.round(financial.totalBilled * 100) / 100,
                totalCollected: Math.round(financial.totalCollected * 100) / 100,
                totalOutstanding: Math.round(financial.totalOutstanding * 100) / 100,
            },
            monthlyRevenue,
            upcomingFollowUps: upcomingEnquiryFollowUps,
            upcomingTasks,
            recentActivities,
        };
    }
}


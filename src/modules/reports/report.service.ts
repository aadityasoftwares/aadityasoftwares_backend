import { InvoiceModel } from "../invoices/models/invoice.model.js";
import { PaymentModel } from "../payments/models/payment.model.js";
import { PaymentStatus } from "../payments/constants/payment.enums.js";
import { EnquiryModel } from "../enquiries/models/enquiry.model.js";
import { ExpenseModel } from "../expenses/models/expense.model.js";
import { InvoiceStatus } from "../invoices/constants/invoice.enums.js";
import { EnquiryStatus } from "../enquiries/constants/enquiry.enums.js";

export class ReportService {
    async getRevenueReport(startDate?: string, endDate?: string) {
        const query: Record<string, any> = { status: PaymentStatus.COMPLETED };
        if (startDate || endDate) {
            query.paymentDate = {};
            if (startDate) query.paymentDate.$gte = new Date(startDate);
            if (endDate) query.paymentDate.$lte = new Date(endDate);
        }

        const [summary, byMethod] = await Promise.all([
            PaymentModel.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$amount" },
                        count: { $sum: 1 },
                    },
                },
            ]),
            PaymentModel.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: "$paymentMethod",
                        total: { $sum: "$amount" },
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        return {
            totalRevenue: summary[0]?.totalRevenue || 0,
            paymentCount: summary[0]?.count || 0,
            byMethod,
        };
    }

    async getInvoiceReport(startDate?: string, endDate?: string) {
        const query: Record<string, any> = { isDeleted: { $ne: true } };
        if (startDate || endDate) {
            query.issueDate = {};
            if (startDate) query.issueDate.$gte = new Date(startDate);
            if (endDate) query.issueDate.$lte = new Date(endDate);
        }

        const byStatus = await InvoiceModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalBilled: { $sum: "$grandTotal" },
                    totalPaid: { $sum: "$paidAmount" },
                    totalOutstanding: { $sum: "$outstandingBalance" },
                },
            },
        ]);

        return { byStatus };
    }

    async getOutstandingReport() {
        const query = {
            isDeleted: { $ne: true },
            status: { $in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
            outstandingBalance: { $gt: 0 },
        };

        const now = new Date();

        const invoices = await InvoiceModel.find(query)
            .populate("clientId", "name companyName email phone")
            .sort({ dueDate: 1 })
            .select("invoiceNumber grandTotal paidAmount outstandingBalance issueDate dueDate clientSnapshot")
            .lean()
            .exec();

        let totalOutstanding = 0;
        const aging = {
            notOverdue: 0,
            days1to30: 0,
            days31to60: 0,
            days61to90: 0,
            days90Plus: 0,
        };

        for (const inv of invoices) {
            totalOutstanding += inv.outstandingBalance;
            const diffDays = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 3600 * 24));

            if (diffDays <= 0) aging.notOverdue += inv.outstandingBalance;
            else if (diffDays <= 30) aging.days1to30 += inv.outstandingBalance;
            else if (diffDays <= 60) aging.days31to60 += inv.outstandingBalance;
            else if (diffDays <= 90) aging.days61to90 += inv.outstandingBalance;
            else aging.days90Plus += inv.outstandingBalance;
        }

        return {
            totalOutstanding: Math.round(totalOutstanding * 100) / 100,
            aging,
            invoices,
        };
    }

    async getGstReport(startDate?: string, endDate?: string) {
        const query: Record<string, any> = {
            isDeleted: { $ne: true },
            status: { $ne: InvoiceStatus.CANCELLED },
        };

        if (startDate || endDate) {
            query.issueDate = {};
            if (startDate) query.issueDate.$gte = new Date(startDate);
            if (endDate) query.issueDate.$lte = new Date(endDate);
        }

        const totals = await InvoiceModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalTaxable: { $sum: "$taxableAmount" },
                    totalCgst: { $sum: "$cgstTotal" },
                    totalSgst: { $sum: "$sgstTotal" },
                    totalIgst: { $sum: "$igstTotal" },
                    totalGrand: { $sum: "$grandTotal" },
                    invoiceCount: { $sum: 1 },
                },
            },
        ]);

        const summary = totals[0] || {
            totalTaxable: 0,
            totalCgst: 0,
            totalSgst: 0,
            totalIgst: 0,
            totalGrand: 0,
            invoiceCount: 0,
        };

        const b2bInvoices = await InvoiceModel.find({ ...query, "clientSnapshot.gstin": { $ne: "" } })
            .select("invoiceNumber issueDate clientSnapshot taxableAmount cgstTotal sgstTotal igstTotal grandTotal")
            .sort({ issueDate: 1 })
            .lean()
            .exec();

        return {
            summary: {
                totalTaxable: Math.round(summary.totalTaxable * 100) / 100,
                totalCgst: Math.round(summary.totalCgst * 100) / 100,
                totalSgst: Math.round(summary.totalSgst * 100) / 100,
                totalIgst: Math.round(summary.totalIgst * 100) / 100,
                totalTax: Math.round((summary.totalCgst + summary.totalSgst + summary.totalIgst) * 100) / 100,
                totalGrand: Math.round(summary.totalGrand * 100) / 100,
                invoiceCount: summary.invoiceCount,
            },
            b2bInvoices,
        };
    }

    async getEnquiryConversionReport() {
        const [total, byStatus, bySource] = await Promise.all([
            EnquiryModel.countDocuments({ isDeleted: { $ne: true } }),
            EnquiryModel.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            EnquiryModel.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                {
                    $group: {
                        _id: "$source",
                        total: { $sum: 1 },
                        won: { $sum: { $cond: [{ $eq: ["$status", EnquiryStatus.WON] }, 1, 0] } },
                    },
                },
            ]),
        ]);

        const wonCount = byStatus.find((s) => s._id === EnquiryStatus.WON)?.count || 0;
        const conversionRate = total > 0 ? Math.round((wonCount / total) * 100) : 0;

        return {
            totalEnquiries: total,
            wonEnquiries: wonCount,
            conversionRate,
            byStatus,
            bySource,
        };
    }

    async getExpenseReport(startDate?: string, endDate?: string) {
        const query: Record<string, any> = { isDeleted: { $ne: true } };
        if (startDate || endDate) {
            query.expenseDate = {};
            if (startDate) query.expenseDate.$gte = new Date(startDate);
            if (endDate) query.expenseDate.$lte = new Date(endDate);
        }

        const [summary, byCategory] = await Promise.all([
            ExpenseModel.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        totalExpenses: { $sum: "$amount" },
                        count: { $sum: 1 },
                    },
                },
            ]),
            ExpenseModel.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: "$category",
                        total: { $sum: "$amount" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { total: -1 } },
            ]),
        ]);

        return {
            totalExpenses: summary[0]?.totalExpenses || 0,
            expenseCount: summary[0]?.count || 0,
            byCategory,
        };
    }
}


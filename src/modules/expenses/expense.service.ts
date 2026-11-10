import { Types } from "mongoose";
import { ExpenseModel, type IExpense, ExpenseCategory, ExpenseStatus } from "./models/expense.model.js";
import { AppError } from "../../utils/errors/app.error.js";
import { getPagination, paginationMeta } from "../../utils/pagination.util.js";
import { SequenceCounterService } from "../../services/sequenceCounter.service.js";
import { AuditLogService } from "../auditlog/services/auditLog.service.js";
import { AppModule } from "../../utils/enums/appModule.enums.js";
import { AuditLogAction } from "../auditlog/constants/auditLog.enums.js";
import type { IAuditLogContext } from "../auditlog/interfaces/auditLog.interface.js";

export class ExpenseService {
    private auditLogService: AuditLogService;

    constructor() {
        this.auditLogService = new AuditLogService();
    }

    async createExpense(data: Partial<IExpense>, userId: string, context?: IAuditLogContext) {
        if (!data.title || !data.title.trim()) {
            throw new AppError("Expense title is required.", 400);
        }
        const amount = Number(data.amount);
        if (isNaN(amount) || amount <= 0) {
            throw new AppError("Expense amount must be greater than zero.", 400);
        }

        const expenseNumber = await SequenceCounterService.getNextSequence("EXP");

        const expense = await ExpenseModel.create({
            ...data,
            expenseNumber,
            amount,
            recordedBy: new Types.ObjectId(userId),
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.EXPENSE,
            action: AuditLogAction.CREATE,
            resourceType: "Expense",
            resourceId: expense._id.toString(),
            resourceName: expense.expenseNumber,
            description: `Expense '${expense.expenseNumber}' (${data.title}) of ${amount} was recorded.`,
        });

        return expense;
    }

    async updateExpense(id: string, data: Partial<IExpense>, userId: string, context?: IAuditLogContext) {
        if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid expense ID.", 400);

        const expense = await ExpenseModel.findOne({ _id: new Types.ObjectId(id), isDeleted: { $ne: true } }).exec();
        if (!expense) throw new AppError("Expense not found.", 404);

        const updated = await ExpenseModel.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true },
        ).exec();

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.EXPENSE,
            action: AuditLogAction.UPDATE,
            resourceType: "Expense",
            resourceId: id,
            resourceName: expense.expenseNumber,
            description: `Expense '${expense.expenseNumber}' was updated.`,
        });

        return updated;
    }

    async getExpenseById(id: string) {
        if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid expense ID.", 400);
        const expense = await ExpenseModel.findOne({ _id: new Types.ObjectId(id), isDeleted: { $ne: true } })
            .populate("recordedBy", "email")
            .populate("currencyId", "name code symbol")
            .populate("receiptMediaId", "publicUrl originalFileName mimeType")
            .exec();
        if (!expense) throw new AppError("Expense not found.", 404);
        return expense;
    }

    async deleteExpense(id: string, userId: string, context?: IAuditLogContext) {
        if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid expense ID.", 400);
        const expense = await ExpenseModel.findOne({ _id: new Types.ObjectId(id), isDeleted: { $ne: true } }).exec();
        if (!expense) throw new AppError("Expense not found.", 404);

        await ExpenseModel.updateOne(
            { _id: new Types.ObjectId(id) },
            { $set: { isDeleted: true, deletedAt: new Date() } },
        ).exec();

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.EXPENSE,
            action: AuditLogAction.DELETE,
            resourceType: "Expense",
            resourceId: id,
            resourceName: expense.expenseNumber,
            description: `Expense '${expense.expenseNumber}' was deleted.`,
        });

        return true;
    }

    async getExpenses(filter: {
        page?: number;
        limit?: number;
        category?: ExpenseCategory;
        status?: ExpenseStatus;
        startDate?: string;
        endDate?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
    }) {
        const { page = 1, limit = 10, category, status, startDate, endDate, search, sortBy = "expenseDate", sortOrder = "desc" } = filter;
        const { skip, limit: validatedLimit } = getPagination(page, limit);

        const query: Record<string, any> = { isDeleted: { $ne: true } };
        if (category) query.category = category;
        if (status) query.status = status;

        if (startDate || endDate) {
            query.expenseDate = {};
            if (startDate) query.expenseDate.$gte = new Date(startDate);
            if (endDate) query.expenseDate.$lte = new Date(endDate);
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [{ expenseNumber: regex }, { title: regex }, { vendorName: regex }, { notes: regex }];
        }

        const [items, total] = await Promise.all([
            ExpenseModel.find(query)
                .populate("recordedBy", "email")
                .populate("currencyId", "name code symbol")
                .populate("receiptMediaId", "publicUrl")
                .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
                .skip(skip)
                .limit(validatedLimit)
                .lean()
                .exec(),
            ExpenseModel.countDocuments(query).exec(),
        ]);

        return {
            items,
            meta: paginationMeta(page, validatedLimit, total),
        };
    }
}


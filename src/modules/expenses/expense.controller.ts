import type { Request, Response, NextFunction } from "express";
import { ExpenseService } from "./expense.service.js";
import { ResponseUtil } from "../../utils/response.util.js";
import { BaseController } from "../../utils/controllers/base.controller.js";

export class ExpenseController extends BaseController {
    private expenseService: ExpenseService;

    constructor() {
        super();
        this.expenseService = new ExpenseService();
    }

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id as string;
            const expense = await this.expenseService.createExpense(req.body, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(201).json(ResponseUtil.created("Expense recorded successfully.", expense));
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const userId = req.user?.id as string;
            const expense = await this.expenseService.updateExpense(id, req.body, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success("Expense updated successfully.", expense));
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const expense = await this.expenseService.getExpenseById(id);
            return res.status(200).json(ResponseUtil.success("Expense fetched successfully.", expense));
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const userId = req.user?.id as string;
            await this.expenseService.deleteExpense(id, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success("Expense deleted successfully."));
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page, limit, category, status, startDate, endDate, search, sortBy, sortOrder } = req.query;
            const result = await this.expenseService.getExpenses({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                category: category as any,
                status: status as any,
                startDate: startDate ? String(startDate) : undefined,
                endDate: endDate ? String(endDate) : undefined,
                search: search ? String(search) : undefined,
                sortBy: sortBy ? String(sortBy) : "expenseDate",
                sortOrder: sortOrder === "asc" ? "asc" : "desc",
            });
            return res.status(200).json(ResponseUtil.paginate("Expenses fetched successfully.", result.items, result.meta));
        } catch (error) {
            next(error);
        }
    };
}


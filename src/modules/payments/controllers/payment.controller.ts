import type { Request, Response, NextFunction } from "express";
import { PaymentService } from "../services/payment.service.js";
import { ResponseUtil } from "../../../utils/response.util.js";
import { BaseController } from "../../../utils/controllers/base.controller.js";

export class PaymentController extends BaseController {
    private paymentService: PaymentService;

    constructor() {
        super();
        this.paymentService = new PaymentService();
    }

    record = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id as string;
            const payment = await this.paymentService.recordPayment(req.body, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(201).json(ResponseUtil.created("Payment recorded successfully.", payment));
        } catch (error) {
            next(error);
        }
    };

    reverse = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const { reason } = req.body;
            const userId = req.user?.id as string;
            const result = await this.paymentService.reversePayment(id, reason, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success("Payment reversed successfully.", result));
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const payment = await this.paymentService.getPaymentById(id);
            return res.status(200).json(ResponseUtil.success("Payment fetched successfully.", payment));
        } catch (error) {
            next(error);
        }
    };

    getByInvoice = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const invoiceId = this.getParam(req.params.invoiceId);
            const payments = await this.paymentService.getPaymentsForInvoice(invoiceId);
            return res.status(200).json(ResponseUtil.success("Payments fetched successfully.", payments));
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page, limit, search, invoiceId, clientId, status, paymentMethod, sortBy, sortOrder } = req.query;
            const result = await this.paymentService.getPayments({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                search: search ? String(search) : undefined,
                invoiceId: invoiceId ? String(invoiceId) : undefined,
                clientId: clientId ? String(clientId) : undefined,
                status: status as any,
                paymentMethod: paymentMethod as any,
                sortBy: sortBy ? String(sortBy) : "paymentDate",
                sortOrder: sortOrder === "asc" ? "asc" : "desc",
            });
            return res.status(200).json(ResponseUtil.paginate("Payments fetched successfully.", result.items, result.meta));
        } catch (error) {
            next(error);
        }
    };
}


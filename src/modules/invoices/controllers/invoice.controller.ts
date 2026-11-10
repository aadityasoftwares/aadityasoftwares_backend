import type { Request, Response, NextFunction } from "express";
import { InvoiceService } from "../services/invoice.service.js";
import { ResponseUtil } from "../../../utils/response.util.js";
import { BaseController } from "../../../utils/controllers/base.controller.js";

export class InvoiceController extends BaseController {
    private invoiceService: InvoiceService;

    constructor() {
        super();
        this.invoiceService = new InvoiceService();
    }

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            const invoice = await this.invoiceService.createInvoice(req.body, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(201).json(ResponseUtil.created("Invoice created successfully.", invoice));
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const userId = req.user?.id;
            const invoice = await this.invoiceService.updateInvoice(id, req.body, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success("Invoice updated successfully.", invoice));
        } catch (error) {
            next(error);
        }
    };

    cancel = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const { reason } = req.body;
            const userId = req.user?.id;
            const invoice = await this.invoiceService.cancelInvoice(id, reason, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success("Invoice cancelled successfully.", invoice));
        } catch (error) {
            next(error);
        }
    };

    downloadPdf = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const pdfBuffer = await this.invoiceService.generatePdf(id);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=invoice-${id}.pdf`);
            return res.send(pdfBuffer);
        } catch (error) {
            next(error);
        }
    };

    sendEmail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const { recipientEmail } = req.body;
            const userId = req.user?.id;
            await this.invoiceService.sendEmailWithPdf(id, recipientEmail, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success("Invoice dispatched via email successfully."));
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const invoice = await this.invoiceService.getInvoiceById(id);
            return res.status(200).json(ResponseUtil.success("Invoice fetched successfully.", invoice));
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const userId = req.user?.id;
            await this.invoiceService.deleteInvoice(id, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success("Invoice deleted successfully."));
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page, limit, search, status, clientId, overdueOnly, sortBy, sortOrder } = req.query;
            const result = await this.invoiceService.getInvoices({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                search: search ? String(search) : undefined,
                status: status as any,
                clientId: clientId ? String(clientId) : undefined,
                overdueOnly: overdueOnly === "true",
                sortBy: sortBy ? String(sortBy) : "createdAt",
                sortOrder: sortOrder === "asc" ? "asc" : "desc",
            });
            return res.status(200).json(ResponseUtil.paginate("Invoices fetched successfully.", result.items, result.meta));
        } catch (error) {
            next(error);
        }
    };
}


import type { Request, Response, NextFunction } from "express";
import { QuotationService } from "../services/quotation.service.js";
import { ResponseUtil } from "../../../utils/response.util.js";
import { BaseController } from "../../../utils/controllers/base.controller.js";

export class QuotationController extends BaseController {
    private quotationService: QuotationService;

    constructor() {
        super();
        this.quotationService = new QuotationService();
    }

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            const quotation = await this.quotationService.createQuotation(req.body, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(201).json(ResponseUtil.created("Quotation created successfully.", quotation));
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const userId = req.user?.id;
            const quotation = await this.quotationService.updateQuotation(id, req.body, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success("Quotation updated successfully.", quotation));
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const quotation = await this.quotationService.getQuotationById(id);
            return res.status(200).json(ResponseUtil.success("Quotation fetched successfully.", quotation));
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const userId = req.user?.id;
            await this.quotationService.deleteQuotation(id, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success("Quotation deleted successfully."));
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page, limit, search, status, clientId, sortBy, sortOrder } = req.query;
            const result = await this.quotationService.getQuotations({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                search: search ? String(search) : undefined,
                status: status as any,
                clientId: clientId ? String(clientId) : undefined,
                sortBy: sortBy ? String(sortBy) : "createdAt",
                sortOrder: sortOrder === "asc" ? "asc" : "desc",
            });
            return res.status(200).json(ResponseUtil.paginate("Quotations fetched successfully.", result.items, result.meta));
        } catch (error) {
            next(error);
        }
    };

    downloadPdf = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const pdfBuffer = await this.quotationService.generatePdf(id);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=quotation-${id}.pdf`);
            return res.send(pdfBuffer);
        } catch (error) {
            next(error);
        }
    };
}


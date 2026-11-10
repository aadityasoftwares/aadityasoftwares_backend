import type { Request, Response, NextFunction } from "express";
import { ReportService } from "./report.service.js";
import { ResponseUtil } from "../../utils/response.util.js";

export class ReportController {
    private reportService: ReportService;

    constructor() {
        this.reportService = new ReportService();
    }

    revenue = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { startDate, endDate } = req.query;
            const data = await this.reportService.getRevenueReport(
                startDate ? String(startDate) : undefined,
                endDate ? String(endDate) : undefined,
            );
            return res.status(200).json(ResponseUtil.success("Revenue report fetched successfully.", data));
        } catch (error) {
            next(error);
        }
    };

    invoices = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { startDate, endDate } = req.query;
            const data = await this.reportService.getInvoiceReport(
                startDate ? String(startDate) : undefined,
                endDate ? String(endDate) : undefined,
            );
            return res.status(200).json(ResponseUtil.success("Invoice report fetched successfully.", data));
        } catch (error) {
            next(error);
        }
    };

    outstanding = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.reportService.getOutstandingReport();
            return res.status(200).json(ResponseUtil.success("Outstanding payment report fetched successfully.", data));
        } catch (error) {
            next(error);
        }
    };

    gst = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { startDate, endDate } = req.query;
            const data = await this.reportService.getGstReport(
                startDate ? String(startDate) : undefined,
                endDate ? String(endDate) : undefined,
            );
            return res.status(200).json(ResponseUtil.success("GST report fetched successfully.", data));
        } catch (error) {
            next(error);
        }
    };

    conversions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.reportService.getEnquiryConversionReport();
            return res.status(200).json(ResponseUtil.success("Enquiry conversion report fetched successfully.", data));
        } catch (error) {
            next(error);
        }
    };

    expenses = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { startDate, endDate } = req.query;
            const data = await this.reportService.getExpenseReport(
                startDate ? String(startDate) : undefined,
                endDate ? String(endDate) : undefined,
            );
            return res.status(200).json(ResponseUtil.success("Expense report fetched successfully.", data));
        } catch (error) {
            next(error);
        }
    };
}


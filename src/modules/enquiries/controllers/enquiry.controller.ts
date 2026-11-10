import type { Request, Response, NextFunction } from "express";
import { EnquiryService } from "../services/enquiry.service.js";
import { EnquiryFollowUpService } from "../../enquiryFollowUps/services/enquiryFollowUp.service.js";
import { ResponseUtil } from "../../../utils/response.util.js";
import { BaseController } from "../../../utils/controllers/base.controller.js";

export class EnquiryController extends BaseController {
    private enquiryService: EnquiryService;
    private followUpService: EnquiryFollowUpService;

    constructor() {
        super();
        this.enquiryService = new EnquiryService();
        this.followUpService = new EnquiryFollowUpService();
    }

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            const enquiry = await this.enquiryService.createEnquiry(req.body, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(201).json(ResponseUtil.created("Enquiry created successfully.", enquiry));
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const userId = req.user?.id;
            const enquiry = await this.enquiryService.updateEnquiry(id, req.body, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success("Enquiry updated successfully.", enquiry));
        } catch (error) {
            next(error);
        }
    };

    assign = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const { assignedTo } = req.body;
            const userId = req.user?.id;
            const enquiry = await this.enquiryService.assignEnquiry(id, assignedTo, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success("Enquiry assigned successfully.", enquiry));
        } catch (error) {
            next(error);
        }
    };

    convertToClient = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const userId = req.user?.id;
            const result = await this.enquiryService.convertToClient(id, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success("Enquiry converted to client successfully.", result));
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const enquiry = await this.enquiryService.getEnquiryById(id);
            return res.status(200).json(ResponseUtil.success("Enquiry fetched successfully.", enquiry));
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const userId = req.user?.id;
            await this.enquiryService.deleteEnquiry(id, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success("Enquiry deleted successfully."));
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page, limit, search, status, priority, assignedTo, source, sortBy, sortOrder } = req.query;
            const result = await this.enquiryService.getEnquiries({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                search: search ? String(search) : undefined,
                status: status as any,
                priority: priority as any,
                assignedTo: assignedTo ? String(assignedTo) : undefined,
                source: source as any,
                sortBy: sortBy ? String(sortBy) : "createdAt",
                sortOrder: sortOrder === "asc" ? "asc" : "desc",
            });
            return res.status(200).json(ResponseUtil.paginate("Enquiries fetched successfully.", result.items, result.meta));
        } catch (error) {
            next(error);
        }
    };

    addFollowUp = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const userId = req.user?.id as string;
            const followUp = await this.followUpService.createFollowUp(
                { ...req.body, enquiryId: id as any },
                userId,
                {
                    ipAddress: req.ip || null,
                    userAgent: req.headers["user-agent"] || null,
                    actorId: userId ? (userId as any) : null,
                },
            );
            return res.status(201).json(ResponseUtil.created("Follow-up added successfully.", followUp));
        } catch (error) {
            next(error);
        }
    };

    getFollowUps = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const followUps = await this.followUpService.getFollowUpsForEnquiry(id);
            return res.status(200).json(ResponseUtil.success("Follow-ups fetched successfully.", followUps));
        } catch (error) {
            next(error);
        }
    };
}


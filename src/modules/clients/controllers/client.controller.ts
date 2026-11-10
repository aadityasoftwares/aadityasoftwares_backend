import type { Request, Response, NextFunction } from "express";
import { ClientService } from "../services/client.service.js";
import { ResponseUtil } from "../../../utils/response.util.js";
import { ClientMessages } from "../constants/client.messages.js";
import { BaseController } from "../../../utils/controllers/base.controller.js";

export class ClientController extends BaseController {
    private clientService: ClientService;

    constructor() {
        super();
        this.clientService = new ClientService();
    }

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            const client = await this.clientService.createClient(req.body, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(201).json(ResponseUtil.created(ClientMessages.CREATED, client));
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const userId = req.user?.id;
            const client = await this.clientService.updateClient(id, req.body, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success(ClientMessages.UPDATED, client));
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const client = await this.clientService.getClientById(id);
            return res.status(200).json(ResponseUtil.success(ClientMessages.FETCHED, client));
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const userId = req.user?.id;
            await this.clientService.deleteClient(id, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success(ClientMessages.DELETED));
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page, limit, search, status, sortBy, sortOrder } = req.query;
            const result = await this.clientService.getClients({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                search: search ? String(search) : undefined,
                status: status as any,
                sortBy: sortBy ? String(sortBy) : "createdAt",
                sortOrder: sortOrder === "asc" ? "asc" : "desc",
            });
            return res.status(200).json(ResponseUtil.paginate(ClientMessages.LIST_FETCHED, result.items, result.meta));
        } catch (error) {
            next(error);
        }
    };
}


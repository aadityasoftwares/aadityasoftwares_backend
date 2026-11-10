import type { Request, Response, NextFunction } from "express";
import { TaskService } from "./task.service.js";
import { ResponseUtil } from "../../utils/response.util.js";
import { BaseController } from "../../utils/controllers/base.controller.js";

export class TaskController extends BaseController {
    private taskService: TaskService;

    constructor() {
        super();
        this.taskService = new TaskService();
    }

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id as string;
            const task = await this.taskService.createTask(req.body, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(201).json(ResponseUtil.created("Task created successfully.", task));
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const userId = req.user?.id as string;
            const task = await this.taskService.updateTask(id, req.body, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success("Task updated successfully.", task));
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const task = await this.taskService.getTaskById(id);
            return res.status(200).json(ResponseUtil.success("Task fetched successfully.", task));
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const userId = req.user?.id as string;
            await this.taskService.deleteTask(id, userId, {
                ipAddress: req.ip || null,
                userAgent: req.headers["user-agent"] || null,
                actorId: userId ? (userId as any) : null,
            });
            return res.status(200).json(ResponseUtil.success("Task deleted successfully."));
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page, limit, status, priority, assignedTo, search, sortBy, sortOrder } = req.query;
            const result = await this.taskService.getTasks({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                status: status as any,
                priority: priority as any,
                assignedTo: assignedTo ? String(assignedTo) : undefined,
                search: search ? String(search) : undefined,
                sortBy: sortBy ? String(sortBy) : "createdAt",
                sortOrder: sortOrder === "asc" ? "asc" : "desc",
            });
            return res.status(200).json(ResponseUtil.paginate("Tasks fetched successfully.", result.items, result.meta));
        } catch (error) {
            next(error);
        }
    };
}


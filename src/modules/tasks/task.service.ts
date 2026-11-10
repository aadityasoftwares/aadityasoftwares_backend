import { Types } from "mongoose";
import { TaskModel, type ITask, TaskStatus, TaskPriority } from "./models/task.model.js";
import { AppError } from "../../utils/errors/app.error.js";
import { getPagination, paginationMeta } from "../../utils/pagination.util.js";
import { AuditLogService } from "../auditlog/services/auditLog.service.js";
import { AppModule } from "../../utils/enums/appModule.enums.js";
import { AuditLogAction } from "../auditlog/constants/auditLog.enums.js";
import type { IAuditLogContext } from "../auditlog/interfaces/auditLog.interface.js";

export class TaskService {
    private auditLogService: AuditLogService;

    constructor() {
        this.auditLogService = new AuditLogService();
    }

    async createTask(data: Partial<ITask>, userId: string, context?: IAuditLogContext) {
        if (!data.title || !data.title.trim()) {
            throw new AppError("Task title is required.", 400);
        }

        const task = await TaskModel.create({
            ...data,
            createdBy: new Types.ObjectId(userId),
            updatedBy: new Types.ObjectId(userId),
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.TASK,
            action: AuditLogAction.CREATE,
            resourceType: "Task",
            resourceId: task._id.toString(),
            resourceName: task.title,
            description: `Task '${task.title}' was created.`,
        });

        return task;
    }

    async updateTask(id: string, data: Partial<ITask>, userId: string, context?: IAuditLogContext) {
        if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid task ID.", 400);

        const task = await TaskModel.findOne({ _id: new Types.ObjectId(id), isDeleted: { $ne: true } }).exec();
        if (!task) throw new AppError("Task not found.", 404);

        if (data.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
            data.completedAt = new Date();
        }

        const updated = await TaskModel.findByIdAndUpdate(
            id,
            { $set: { ...data, updatedBy: new Types.ObjectId(userId) } },
            { new: true },
        ).exec();

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.TASK,
            action: AuditLogAction.UPDATE,
            resourceType: "Task",
            resourceId: id,
            resourceName: task.title,
            description: `Task '${task.title}' was updated.`,
        });

        return updated;
    }

    async getTaskById(id: string) {
        if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid task ID.", 400);
        const task = await TaskModel.findOne({ _id: new Types.ObjectId(id), isDeleted: { $ne: true } })
            .populate("assignedTo", "email")
            .populate("relatedClient", "name companyName")
            .populate("relatedEnquiry", "enquiryNumber projectTitle")
            .populate("relatedInvoice", "invoiceNumber")
            .exec();
        if (!task) throw new AppError("Task not found.", 404);
        return task;
    }

    async deleteTask(id: string, userId: string, context?: IAuditLogContext) {
        if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid task ID.", 400);
        const task = await TaskModel.findOne({ _id: new Types.ObjectId(id), isDeleted: { $ne: true } }).exec();
        if (!task) throw new AppError("Task not found.", 404);

        await TaskModel.updateOne(
            { _id: new Types.ObjectId(id) },
            { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: new Types.ObjectId(userId) } },
        ).exec();

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.TASK,
            action: AuditLogAction.DELETE,
            resourceType: "Task",
            resourceId: id,
            resourceName: task.title,
            description: `Task '${task.title}' was deleted.`,
        });

        return true;
    }

    async getTasks(filter: {
        page?: number;
        limit?: number;
        status?: TaskStatus;
        priority?: TaskPriority;
        assignedTo?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
    }) {
        const { page = 1, limit = 10, status, priority, assignedTo, search, sortBy = "createdAt", sortOrder = "desc" } = filter;
        const { skip, limit: validatedLimit } = getPagination(page, limit);

        const query: Record<string, any> = { isDeleted: { $ne: true } };
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (assignedTo && Types.ObjectId.isValid(assignedTo)) query.assignedTo = new Types.ObjectId(assignedTo);

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [{ title: regex }, { description: regex }];
        }

        const [items, total] = await Promise.all([
            TaskModel.find(query)
                .populate("assignedTo", "email")
                .populate("relatedClient", "name companyName")
                .populate("relatedEnquiry", "enquiryNumber")
                .populate("relatedInvoice", "invoiceNumber")
                .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
                .skip(skip)
                .limit(validatedLimit)
                .lean()
                .exec(),
            TaskModel.countDocuments(query).exec(),
        ]);

        return {
            items,
            meta: paginationMeta(page, validatedLimit, total),
        };
    }
}


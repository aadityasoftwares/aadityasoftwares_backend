import { Types } from "mongoose";
import { BlogRedirectRepository } from "../repositories/blogRedirect.repository.js";
import { AppError } from "../../../utils/errors/app.error.js";
import { BlogMessages } from "../constants/blog.messages.js";
import { BlogRedirectStatus, BlogRedirectType } from "../constants/blog.enums.js";
import type { IBlogRedirect, IBlogRedirectFilter } from "../interfaces/blog.interface.js";
import { AuditLogService } from "../../auditlog/services/auditLog.service.js";
import { AppModule } from "../../../utils/enums/appModule.enums.js";
import { AuditLogAction } from "../../auditlog/constants/auditLog.enums.js";
import type { IAuditLogContext } from "../../auditlog/interfaces/auditLog.interface.js";

export class BlogRedirectService {
    private redirectRepo: BlogRedirectRepository;
    private auditLogService: AuditLogService;

    constructor() {
        this.redirectRepo = new BlogRedirectRepository();
        this.auditLogService = new AuditLogService();
    }

    private normalizePath(path: string): string {
        let clean = path.trim();
        if (!clean.startsWith("/")) clean = `/${clean}`;
        return clean.replace(/\/+$/, "") || "/";
    }

    async createRedirect(data: Partial<IBlogRedirect>, userId?: string, context?: IAuditLogContext) {
        if (!data.websiteId || !Types.ObjectId.isValid(String(data.websiteId))) {
            throw new AppError("Valid website ID is required.", 400);
        }
        if (!data.sourcePath || !data.sourcePath.trim()) throw new AppError(BlogMessages.REDIRECT_SOURCE_REQUIRED, 400);
        if (!data.destinationPath || !data.destinationPath.trim()) {
            throw new AppError(BlogMessages.REDIRECT_DESTINATION_REQUIRED, 400);
        }

        const websiteIdStr = String(data.websiteId);
        const sourcePath = this.normalizePath(data.sourcePath);
        const destinationPath = this.normalizePath(data.destinationPath);

        if (sourcePath === destinationPath) {
            throw new AppError(BlogMessages.REDIRECT_LOOP, 400);
        }

        if (await this.redirectRepo.existsBySource(websiteIdStr, sourcePath)) {
            throw new AppError(BlogMessages.REDIRECT_SOURCE_EXISTS, 409);
        }

        const redirect = await this.redirectRepo.create({
            ...data,
            sourcePath,
            destinationPath,
            redirectType: data.redirectType || BlogRedirectType.PERMANENT,
            status: data.status || BlogRedirectStatus.ACTIVE,
            createdBy: userId as any,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.CREATE,
            resourceId: String(redirect._id),
            resourceName: `${sourcePath} -> ${destinationPath}`,
            description: `Blog redirect created from ${sourcePath} to ${destinationPath}.`,
        });

        return redirect;
    }

    async updateRedirect(id: string, data: Partial<IBlogRedirect>, userId?: string, context?: IAuditLogContext) {
        const existing = await this.redirectRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.REDIRECT_NOT_FOUND, 404);

        const websiteIdStr = String(existing.websiteId);
        const sourcePath = data.sourcePath ? this.normalizePath(data.sourcePath) : existing.sourcePath;
        const destinationPath = data.destinationPath
            ? this.normalizePath(data.destinationPath)
            : existing.destinationPath;

        if (sourcePath === destinationPath) {
            throw new AppError(BlogMessages.REDIRECT_LOOP, 400);
        }

        if (data.sourcePath && sourcePath !== existing.sourcePath) {
            if (await this.redirectRepo.existsBySource(websiteIdStr, sourcePath, id)) {
                throw new AppError(BlogMessages.REDIRECT_SOURCE_EXISTS, 409);
            }
        }

        const updated = await this.redirectRepo.update(id, {
            ...data,
            sourcePath,
            destinationPath,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.UPDATE,
            resourceId: id,
            resourceName: `${sourcePath} -> ${destinationPath}`,
            description: `Blog redirect updated to ${sourcePath} -> ${destinationPath}.`,
        });

        return updated;
    }

    async deleteRedirect(id: string, userId?: string, context?: IAuditLogContext) {
        const existing = await this.redirectRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.REDIRECT_NOT_FOUND, 404);

        await this.redirectRepo.delete(id);

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.DELETE,
            resourceId: id,
            resourceName: existing.sourcePath,
            description: `Blog redirect ${existing.sourcePath} deleted.`,
        });

        return true;
    }

    async resolveRedirect(websiteId: string, path: string) {
        const normalized = this.normalizePath(path);
        return this.redirectRepo.findBySource(websiteId, normalized);
    }

    async getRedirects(filter: IBlogRedirectFilter = {}) {
        return this.redirectRepo.findAll(filter);
    }
}


import { Types } from "mongoose";
import { BlogTagRepository } from "../repositories/blogTag.repository.js";
import { BlogRepository } from "../repositories/blog.repository.js";
import { AppError } from "../../../utils/errors/app.error.js";
import { BlogMessages } from "../constants/blog.messages.js";
import { BlogStatus, BlogTagStatus } from "../constants/blog.enums.js";
import type { IBlogTag, IBlogTagFilter } from "../interfaces/blog.interface.js";
import { AuditLogService } from "../../auditlog/services/auditLog.service.js";
import { AppModule } from "../../../utils/enums/appModule.enums.js";
import { AuditLogAction } from "../../auditlog/constants/auditLog.enums.js";
import type { IAuditLogContext } from "../../auditlog/interfaces/auditLog.interface.js";

export class BlogTagService {
    private tagRepo: BlogTagRepository;
    private blogRepo: BlogRepository;
    private auditLogService: AuditLogService;

    constructor() {
        this.tagRepo = new BlogTagRepository();
        this.blogRepo = new BlogRepository();
        this.auditLogService = new AuditLogService();
    }

    async createTag(data: Partial<IBlogTag>, userId?: string, context?: IAuditLogContext) {
        if (!data.websiteId || !Types.ObjectId.isValid(String(data.websiteId))) {
            throw new AppError("Valid website ID is required.", 400);
        }
        if (!data.name || !data.name.trim()) throw new AppError(BlogMessages.TAG_NAME_REQUIRED, 400);
        if (!data.slug || !data.slug.trim()) throw new AppError(BlogMessages.TAG_SLUG_REQUIRED, 400);

        const websiteIdStr = String(data.websiteId);
        const normalizedSlug = data.slug.toLowerCase().trim();

        if (await this.tagRepo.existsBySlug(websiteIdStr, normalizedSlug)) {
            throw new AppError(BlogMessages.TAG_SLUG_EXISTS, 409);
        }

        const tag = await this.tagRepo.create({
            ...data,
            slug: normalizedSlug,
            status: data.status || BlogTagStatus.ACTIVE,
            createdBy: userId as any,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.CREATE,
            resourceId: String(tag._id),
            resourceName: tag.name,
            description: `Blog tag "${tag.name}" created.`,
        });

        return tag;
    }

    async updateTag(id: string, data: Partial<IBlogTag>, userId?: string, context?: IAuditLogContext) {
        const existing = await this.tagRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.TAG_NOT_FOUND, 404);

        if (data.slug) {
            const normalizedSlug = data.slug.toLowerCase().trim();
            if (await this.tagRepo.existsBySlug(String(existing.websiteId), normalizedSlug, id)) {
                throw new AppError(BlogMessages.TAG_SLUG_EXISTS, 409);
            }
            data.slug = normalizedSlug;
        }

        const updated = await this.tagRepo.update(id, {
            ...data,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.UPDATE,
            resourceId: id,
            resourceName: existing.name,
            description: `Blog tag "${existing.name}" updated.`,
        });

        return updated;
    }

    async deleteTag(id: string, userId?: string, context?: IAuditLogContext) {
        const existing = await this.tagRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.TAG_NOT_FOUND, 404);

        const activeBlogsCount = await this.blogRepo.countByTagId(id, BlogStatus.PUBLISHED);
        if (activeBlogsCount > 0) {
            throw new AppError(BlogMessages.TAG_IN_USE, 400);
        }

        // Clean up from blogs
        const { BlogModel } = await import("../models/blog.model.js");
        await BlogModel.updateMany({ tagIds: new Types.ObjectId(id) }, { $pull: { tagIds: new Types.ObjectId(id) } });

        await this.tagRepo.delete(id);

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.DELETE,
            resourceId: id,
            resourceName: existing.name,
            description: `Blog tag "${existing.name}" deleted.`,
        });

        return true;
    }

    async getTagById(id: string) {
        const tag = await this.tagRepo.findById(id);
        if (!tag) throw new AppError(BlogMessages.TAG_NOT_FOUND, 404);
        return tag;
    }

    async getTagBySlug(websiteId: string, slug: string) {
        const tag = await this.tagRepo.findBySlug(websiteId, slug);
        if (!tag) throw new AppError(BlogMessages.TAG_NOT_FOUND, 404);
        return tag;
    }

    async getTags(filter: IBlogTagFilter = {}) {
        return this.tagRepo.findAll(filter);
    }
}


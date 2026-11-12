import { Types } from "mongoose";
import { BlogAuthorRepository } from "../repositories/blogAuthor.repository.js";
import { BlogRepository } from "../repositories/blog.repository.js";
import { AppError } from "../../../utils/errors/app.error.js";
import { BlogMessages } from "../constants/blog.messages.js";
import { BlogAuthorStatus } from "../constants/blog.enums.js";
import type { IBlogAuthor, IBlogAuthorFilter } from "../interfaces/blog.interface.js";
import { AuditLogService } from "../../auditlog/services/auditLog.service.js";
import { AppModule } from "../../../utils/enums/appModule.enums.js";
import { AuditLogAction } from "../../auditlog/constants/auditLog.enums.js";
import type { IAuditLogContext } from "../../auditlog/interfaces/auditLog.interface.js";
import { formatMediaObject } from "../../../utils/mediaUrl.util.js";

export class BlogAuthorService {
    private authorRepo: BlogAuthorRepository;
    private blogRepo: BlogRepository;
    private auditLogService: AuditLogService;

    constructor() {
        this.authorRepo = new BlogAuthorRepository();
        this.blogRepo = new BlogRepository();
        this.auditLogService = new AuditLogService();
    }

    private formatAuthor(author: any) {
        if (!author) return author;
        const obj = typeof author.toObject === "function" ? author.toObject() : { ...author };
        if (obj.profileImageMediaId && typeof obj.profileImageMediaId === "object") {
            obj.profileImageMediaId = formatMediaObject(obj.profileImageMediaId);
        }
        return obj;
    }

    async createAuthor(data: Partial<IBlogAuthor>, userId?: string, context?: IAuditLogContext) {
        if (!data.websiteId || !Types.ObjectId.isValid(String(data.websiteId))) {
            throw new AppError("Valid website ID is required.", 400);
        }
        if (!data.name || !data.name.trim()) throw new AppError(BlogMessages.AUTHOR_NAME_REQUIRED, 400);
        if (!data.slug || !data.slug.trim()) throw new AppError(BlogMessages.AUTHOR_SLUG_REQUIRED, 400);

        const websiteIdStr = String(data.websiteId);
        const normalizedSlug = data.slug.toLowerCase().trim();

        if (await this.authorRepo.existsBySlug(websiteIdStr, normalizedSlug)) {
            throw new AppError(BlogMessages.AUTHOR_SLUG_EXISTS, 409);
        }

        const author = await this.authorRepo.create({
            ...data,
            slug: normalizedSlug,
            status: data.status || BlogAuthorStatus.ACTIVE,
            createdBy: userId as any,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.CREATE,
            resourceId: String(author._id),
            resourceName: author.name,
            description: `Blog author "${author.name}" created.`,
        });

        return this.formatAuthor(author);
    }

    async updateAuthor(id: string, data: Partial<IBlogAuthor>, userId?: string, context?: IAuditLogContext) {
        const existing = await this.authorRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.AUTHOR_NOT_FOUND, 404);

        if (data.slug) {
            const normalizedSlug = data.slug.toLowerCase().trim();
            if (await this.authorRepo.existsBySlug(String(existing.websiteId), normalizedSlug, id)) {
                throw new AppError(BlogMessages.AUTHOR_SLUG_EXISTS, 409);
            }
            data.slug = normalizedSlug;
        }

        const updated = await this.authorRepo.update(id, {
            ...data,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.UPDATE,
            resourceId: id,
            resourceName: existing.name,
            description: `Blog author "${existing.name}" updated.`,
        });

        return this.formatAuthor(updated);
    }

    async deleteAuthor(id: string, userId?: string, context?: IAuditLogContext) {
        const existing = await this.authorRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.AUTHOR_NOT_FOUND, 404);

        const count = await this.blogRepo.countByAuthorId(id);
        if (count > 0) {
            throw new AppError("Cannot delete author who has written articles.", 400);
        }

        await this.authorRepo.delete(id);

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.DELETE,
            resourceId: id,
            resourceName: existing.name,
            description: `Blog author "${existing.name}" deleted.`,
        });

        return true;
    }

    async getAuthorById(id: string) {
        const author = await this.authorRepo.findById(id);
        if (!author) throw new AppError(BlogMessages.AUTHOR_NOT_FOUND, 404);
        return this.formatAuthor(author);
    }

    async getAuthorBySlug(websiteId: string, slug: string) {
        const author = await this.authorRepo.findBySlug(websiteId, slug);
        if (!author) throw new AppError(BlogMessages.AUTHOR_NOT_FOUND, 404);
        return this.formatAuthor(author);
    }

    async getAuthors(filter: IBlogAuthorFilter = {}) {
        const result = await this.authorRepo.findAll(filter);
        return {
            ...result,
            data: result.data.map((a: any) => this.formatAuthor(a)),
        };
    }
}


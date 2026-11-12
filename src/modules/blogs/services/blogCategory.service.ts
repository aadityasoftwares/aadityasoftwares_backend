import { Types } from "mongoose";
import { BlogCategoryRepository } from "../repositories/blogCategory.repository.js";
import { BlogRepository } from "../repositories/blog.repository.js";
import { AppError } from "../../../utils/errors/app.error.js";
import { BlogMessages } from "../constants/blog.messages.js";
import { BlogCategoryStatus, BlogStatus } from "../constants/blog.enums.js";
import type { IBlogCategory, IBlogCategoryFilter } from "../interfaces/blog.interface.js";
import { AuditLogService } from "../../auditlog/services/auditLog.service.js";
import { AppModule } from "../../../utils/enums/appModule.enums.js";
import { AuditLogAction } from "../../auditlog/constants/auditLog.enums.js";
import type { IAuditLogContext } from "../../auditlog/interfaces/auditLog.interface.js";
import { formatMediaObject } from "../../../utils/mediaUrl.util.js";

export class BlogCategoryService {
    private categoryRepo: BlogCategoryRepository;
    private blogRepo: BlogRepository;
    private auditLogService: AuditLogService;

    constructor() {
        this.categoryRepo = new BlogCategoryRepository();
        this.blogRepo = new BlogRepository();
        this.auditLogService = new AuditLogService();
    }

    private formatCategory(category: any) {
        if (!category) return category;
        const obj = typeof category.toObject === "function" ? category.toObject() : { ...category };
        if (obj.featuredImageMediaId && typeof obj.featuredImageMediaId === "object") {
            obj.featuredImageMediaId = formatMediaObject(obj.featuredImageMediaId);
        }
        if (obj.seo?.ogImageMediaId && typeof obj.seo.ogImageMediaId === "object") {
            obj.seo.ogImageMediaId = formatMediaObject(obj.seo.ogImageMediaId);
        }
        return obj;
    }

    async createCategory(data: Partial<IBlogCategory>, userId?: string, context?: IAuditLogContext) {
        if (!data.websiteId || !Types.ObjectId.isValid(String(data.websiteId))) {
            throw new AppError("Valid website ID is required.", 400);
        }
        if (!data.name || !data.name.trim()) throw new AppError(BlogMessages.CATEGORY_NAME_REQUIRED, 400);
        if (!data.slug || !data.slug.trim()) throw new AppError(BlogMessages.CATEGORY_SLUG_REQUIRED, 400);

        const websiteIdStr = String(data.websiteId);
        const normalizedSlug = data.slug.toLowerCase().trim();

        if (await this.categoryRepo.existsBySlug(websiteIdStr, normalizedSlug)) {
            throw new AppError(BlogMessages.CATEGORY_SLUG_EXISTS, 409);
        }

        if (data.parentCategoryId) {
            const parentIdStr = String(data.parentCategoryId);
            const parent = await this.categoryRepo.findById(parentIdStr);
            if (!parent || String(parent.websiteId) !== websiteIdStr) {
                throw new AppError("Parent category not found or does not belong to the same website.", 400);
            }
        }

        const category = await this.categoryRepo.create({
            ...data,
            slug: normalizedSlug,
            status: data.status || BlogCategoryStatus.ACTIVE,
            createdBy: userId as any,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.CREATE,
            resourceId: String(category._id),
            resourceName: category.name,
            description: `Blog category "${category.name}" created.`,
        });

        return this.formatCategory(category);
    }

    async updateCategory(id: string, data: Partial<IBlogCategory>, userId?: string, context?: IAuditLogContext) {
        const existing = await this.categoryRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.CATEGORY_NOT_FOUND, 404);

        const websiteIdStr = String(existing.websiteId);

        if (data.slug) {
            const normalizedSlug = data.slug.toLowerCase().trim();
            if (await this.categoryRepo.existsBySlug(websiteIdStr, normalizedSlug, id)) {
                throw new AppError(BlogMessages.CATEGORY_SLUG_EXISTS, 409);
            }
            data.slug = normalizedSlug;
        }

        if (data.parentCategoryId !== undefined) {
            if (data.parentCategoryId && String(data.parentCategoryId) === id) {
                throw new AppError(BlogMessages.CATEGORY_CANNOT_PARENT_SELF, 400);
            }
            if (data.parentCategoryId) {
                const parentIdStr = String(data.parentCategoryId);
                const parent = await this.categoryRepo.findById(parentIdStr);
                if (!parent || String(parent.websiteId) !== websiteIdStr) {
                    throw new AppError("Parent category not found or does not belong to the same website.", 400);
                }

                // Check circular relationship: new parent cannot be a descendant of this category
                const descendantIds = await this.categoryRepo.findDescendantIds(id);
                if (descendantIds.includes(parentIdStr)) {
                    throw new AppError(BlogMessages.CATEGORY_CIRCULAR_PARENT, 400);
                }
            }
        }

        const updated = await this.categoryRepo.update(id, {
            ...data,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.UPDATE,
            resourceId: id,
            resourceName: existing.name,
            description: `Blog category "${existing.name}" updated.`,
        });

        return this.formatCategory(updated);
    }

    async deleteCategory(id: string, reassignedCategoryId?: string, userId?: string, context?: IAuditLogContext) {
        const existing = await this.categoryRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.CATEGORY_NOT_FOUND, 404);

        const publishedBlogsCount = await this.blogRepo.countByCategoryId(id, BlogStatus.PUBLISHED);
        if (publishedBlogsCount > 0 && !reassignedCategoryId) {
            throw new AppError(BlogMessages.CATEGORY_HAS_BLOGS, 400);
        }

        if (reassignedCategoryId) {
            const replacement = await this.categoryRepo.findById(reassignedCategoryId);
            if (!replacement || String(replacement.websiteId) !== String(existing.websiteId)) {
                throw new AppError("Replacement category not found on this website.", 400);
            }
            // Reassign blog articles
            const { BlogModel } = await import("../models/blog.model.js");
            await BlogModel.updateMany(
                { categoryIds: new Types.ObjectId(id) },
                { $addToSet: { categoryIds: new Types.ObjectId(reassignedCategoryId) } },
            );
            await BlogModel.updateMany(
                { categoryIds: new Types.ObjectId(id) },
                { $pull: { categoryIds: new Types.ObjectId(id) } },
            );
        }

        await this.categoryRepo.delete(id);

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.DELETE,
            resourceId: id,
            resourceName: existing.name,
            description: `Blog category "${existing.name}" deleted.`,
        });

        return true;
    }

    async getCategoryById(id: string) {
        const category = await this.categoryRepo.findById(id);
        if (!category) throw new AppError(BlogMessages.CATEGORY_NOT_FOUND, 404);
        return this.formatCategory(category);
    }

    async getCategoryBySlug(websiteId: string, slug: string) {
        const category = await this.categoryRepo.findBySlug(websiteId, slug);
        if (!category) throw new AppError(BlogMessages.CATEGORY_NOT_FOUND, 404);
        return this.formatCategory(category);
    }

    async getCategories(filter: IBlogCategoryFilter = {}) {
        const result = await this.categoryRepo.findAll(filter);
        return {
            ...result,
            data: result.data.map((c: any) => this.formatCategory(c)),
        };
    }
}


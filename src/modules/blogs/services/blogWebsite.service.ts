import { Types } from "mongoose";
import { BlogWebsiteRepository } from "../repositories/blogWebsite.repository.js";
import { AppError } from "../../../utils/errors/app.error.js";
import { BlogMessages } from "../constants/blog.messages.js";
import { BlogWebsiteStatus } from "../constants/blog.enums.js";
import type { IBlogWebsite, IBlogWebsiteFilter } from "../interfaces/blog.interface.js";
import { AuditLogService } from "../../auditlog/services/auditLog.service.js";
import { AppModule } from "../../../utils/enums/appModule.enums.js";
import { AuditLogAction } from "../../auditlog/constants/auditLog.enums.js";
import type { IAuditLogContext } from "../../auditlog/interfaces/auditLog.interface.js";
import { formatMediaObject } from "../../../utils/mediaUrl.util.js";

export class BlogWebsiteService {
    private websiteRepo: BlogWebsiteRepository;
    private auditLogService: AuditLogService;

    constructor() {
        this.websiteRepo = new BlogWebsiteRepository();
        this.auditLogService = new AuditLogService();
    }

    private formatWebsite(website: any) {
        if (!website) return website;
        const obj = typeof website.toObject === "function" ? website.toObject() : { ...website };
        if (obj.logoMediaId && typeof obj.logoMediaId === "object") {
            obj.logoMediaId = formatMediaObject(obj.logoMediaId);
        }
        if (obj.faviconMediaId && typeof obj.faviconMediaId === "object") {
            obj.faviconMediaId = formatMediaObject(obj.faviconMediaId);
        }
        if (obj.defaultSeo?.ogImageMediaId && typeof obj.defaultSeo.ogImageMediaId === "object") {
            obj.defaultSeo.ogImageMediaId = formatMediaObject(obj.defaultSeo.ogImageMediaId);
        }
        if (obj.defaultSeo?.twitterImageMediaId && typeof obj.defaultSeo.twitterImageMediaId === "object") {
            obj.defaultSeo.twitterImageMediaId = formatMediaObject(obj.defaultSeo.twitterImageMediaId);
        }
        return obj;
    }

    async createWebsite(data: Partial<IBlogWebsite>, userId?: string, context?: IAuditLogContext) {
        if (!data.name || !data.name.trim()) throw new AppError(BlogMessages.WEBSITE_NAME_REQUIRED, 400);
        if (!data.slug || !data.slug.trim()) throw new AppError(BlogMessages.WEBSITE_SLUG_REQUIRED, 400);
        if (!data.domain || !data.domain.trim()) throw new AppError(BlogMessages.WEBSITE_DOMAIN_REQUIRED, 400);
        if (!data.baseUrl || !data.baseUrl.trim()) throw new AppError(BlogMessages.WEBSITE_BASE_URL_REQUIRED, 400);

        const normalizedSlug = data.slug.toLowerCase().trim();
        const normalizedDomain = data.domain.toLowerCase().trim();

        if (await this.websiteRepo.existsBySlug(normalizedSlug)) {
            throw new AppError(BlogMessages.WEBSITE_SLUG_EXISTS, 409);
        }
        if (await this.websiteRepo.existsByDomain(normalizedDomain)) {
            throw new AppError(BlogMessages.WEBSITE_DOMAIN_EXISTS, 409);
        }

        const website = await this.websiteRepo.create({
            ...data,
            slug: normalizedSlug,
            domain: normalizedDomain,
            baseUrl: data.baseUrl.trim().replace(/\/+$/, ""),
            status: data.status || BlogWebsiteStatus.ACTIVE,
            createdBy: userId as any,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.CREATE,
            resourceId: String(website._id),
            resourceName: website.name,
            description: `Blog website "${website.name}" created.`,
        });

        return this.formatWebsite(website);
    }

    async updateWebsite(id: string, data: Partial<IBlogWebsite>, userId?: string, context?: IAuditLogContext) {
        const existing = await this.websiteRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.WEBSITE_NOT_FOUND, 404);

        if (data.slug) {
            const normalizedSlug = data.slug.toLowerCase().trim();
            if (await this.websiteRepo.existsBySlug(normalizedSlug, id)) {
                throw new AppError(BlogMessages.WEBSITE_SLUG_EXISTS, 409);
            }
            data.slug = normalizedSlug;
        }

        if (data.domain) {
            const normalizedDomain = data.domain.toLowerCase().trim();
            if (await this.websiteRepo.existsByDomain(normalizedDomain, id)) {
                throw new AppError(BlogMessages.WEBSITE_DOMAIN_EXISTS, 409);
            }
            data.domain = normalizedDomain;
        }

        if (data.baseUrl) {
            data.baseUrl = data.baseUrl.trim().replace(/\/+$/, "");
        }

        const updated = await this.websiteRepo.update(id, {
            ...data,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.UPDATE,
            resourceId: id,
            resourceName: existing.name,
            description: `Blog website "${existing.name}" updated.`,
        });

        return this.formatWebsite(updated);
    }

    async getWebsiteById(id: string) {
        const website = await this.websiteRepo.findById(id);
        if (!website) throw new AppError(BlogMessages.WEBSITE_NOT_FOUND, 404);
        return this.formatWebsite(website);
    }

    async getWebsiteBySlug(slug: string) {
        const website = await this.websiteRepo.findBySlug(slug);
        if (!website) throw new AppError(BlogMessages.WEBSITE_NOT_FOUND, 404);
        return this.formatWebsite(website);
    }

    async getWebsiteByDomain(domain: string) {
        const website = await this.websiteRepo.findByDomain(domain);
        if (!website) throw new AppError(BlogMessages.WEBSITE_NOT_FOUND, 404);
        return this.formatWebsite(website);
    }

    async getWebsites(filter: IBlogWebsiteFilter = {}) {
        const result = await this.websiteRepo.findAll(filter);
        return {
            ...result,
            data: result.data.map((w: any) => this.formatWebsite(w)),
        };
    }

    async updateStatus(id: string, status: BlogWebsiteStatus, userId?: string, context?: IAuditLogContext) {
        const existing = await this.websiteRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.WEBSITE_NOT_FOUND, 404);

        const updated = await this.websiteRepo.update(id, {
            status,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.STATUS_CHANGE,
            resourceId: id,
            resourceName: existing.name,
            description: `Blog website "${existing.name}" status changed to ${status}.`,
        });

        return this.formatWebsite(updated);
    }
}


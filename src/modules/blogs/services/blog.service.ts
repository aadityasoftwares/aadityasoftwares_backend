import { Types } from "mongoose";
import { BlogRepository } from "../repositories/blog.repository.js";
import { BlogWebsiteRepository } from "../repositories/blogWebsite.repository.js";
import { BlogCategoryRepository } from "../repositories/blogCategory.repository.js";
import { BlogTagRepository } from "../repositories/blogTag.repository.js";
import { BlogAuthorRepository } from "../repositories/blogAuthor.repository.js";
import { BlogRevisionRepository } from "../repositories/blogRevision.repository.js";
import { BlogRedirectService } from "./blogRedirect.service.js";
import { BlogContentUtil } from "./blogContent.util.js";
import { BlogSeoService } from "./blogSeo.service.js";
import { AppError } from "../../../utils/errors/app.error.js";
import { BlogMessages } from "../constants/blog.messages.js";
import { BlogRedirectType, BlogStatus } from "../constants/blog.enums.js";
import type { IBlog, IBlogFilter } from "../interfaces/blog.interface.js";
import { AuditLogService } from "../../auditlog/services/auditLog.service.js";
import { AppModule } from "../../../utils/enums/appModule.enums.js";
import { AuditLogAction } from "../../auditlog/constants/auditLog.enums.js";
import type { IAuditLogContext } from "../../auditlog/interfaces/auditLog.interface.js";
import { formatMediaObject, resolveRichTextMediaUrls } from "../../../utils/mediaUrl.util.js";

export class BlogService {
    private blogRepo: BlogRepository;
    private websiteRepo: BlogWebsiteRepository;
    private categoryRepo: BlogCategoryRepository;
    private tagRepo: BlogTagRepository;
    private authorRepo: BlogAuthorRepository;
    private revisionRepo: BlogRevisionRepository;
    private redirectService: BlogRedirectService;
    private auditLogService: AuditLogService;

    constructor() {
        this.blogRepo = new BlogRepository();
        this.websiteRepo = new BlogWebsiteRepository();
        this.categoryRepo = new BlogCategoryRepository();
        this.tagRepo = new BlogTagRepository();
        this.authorRepo = new BlogAuthorRepository();
        this.revisionRepo = new BlogRevisionRepository();
        this.redirectService = new BlogRedirectService();
        this.auditLogService = new AuditLogService();
    }

    private formatBlogResponse(blog: any) {
        if (!blog) return blog;
        const obj = typeof blog.toObject === "function" ? blog.toObject() : { ...blog };
        if (obj.featuredImageMediaId && typeof obj.featuredImageMediaId === "object") {
            obj.featuredImageMediaId = formatMediaObject(obj.featuredImageMediaId);
        }
        if (obj.seo?.ogImageMediaId && typeof obj.seo.ogImageMediaId === "object") {
            obj.seo.ogImageMediaId = formatMediaObject(obj.seo.ogImageMediaId);
        }
        if (obj.seo?.twitterImageMediaId && typeof obj.seo.twitterImageMediaId === "object") {
            obj.seo.twitterImageMediaId = formatMediaObject(obj.seo.twitterImageMediaId);
        }
        if (obj.authorId && typeof obj.authorId === "object" && obj.authorId.profileImageMediaId && typeof obj.authorId.profileImageMediaId === "object") {
            obj.authorId = {
                ...obj.authorId,
                profileImageMediaId: formatMediaObject(obj.authorId.profileImageMediaId),
            };
        }
        if (Array.isArray(obj.coAuthorIds)) {
            obj.coAuthorIds = obj.coAuthorIds.map((co: any) => {
                if (co && typeof co === "object" && co.profileImageMediaId && typeof co.profileImageMediaId === "object") {
                    return { ...co, profileImageMediaId: formatMediaObject(co.profileImageMediaId) };
                }
                return co;
            });
        }
        if (Array.isArray(obj.categoryIds)) {
            obj.categoryIds = obj.categoryIds.map((cat: any) => {
                if (cat && typeof cat === "object" && cat.featuredImageMediaId && typeof cat.featuredImageMediaId === "object") {
                    return { ...cat, featuredImageMediaId: formatMediaObject(cat.featuredImageMediaId) };
                }
                return cat;
            });
        }
        if (obj.content) {
            obj.content = resolveRichTextMediaUrls(obj.content);
        }
        return obj;
    }

    private async validateWebsite(websiteId: string) {
        if (!Types.ObjectId.isValid(websiteId)) {
            throw new AppError("Invalid website ID.", 400);
        }
        const website = await this.websiteRepo.findById(websiteId);
        if (!website) {
            throw new AppError(BlogMessages.WEBSITE_NOT_FOUND, 404);
        }
        return website;
    }

    private async validateReferences(
        websiteId: string,
        authorId: string | any,
        categoryIds?: (string | Types.ObjectId | any)[],
        tagIds?: (string | Types.ObjectId | any)[],
        coAuthorIds?: (string | Types.ObjectId | any)[],
    ) {
        const idOf = (item: any) => (item?._id ? String(item._id) : String(item));

        // Author check
        const cleanAuthorId = idOf(authorId);
        const author = await this.authorRepo.findById(cleanAuthorId);
        if (!author || String(author.websiteId) !== websiteId) {
            throw new AppError(BlogMessages.BLOG_AUTHOR_MISMATCH, 400);
        }

        // Categories check
        if (categoryIds && categoryIds.length > 0) {
            for (const catId of categoryIds) {
                const cleanCatId = idOf(catId);
                const cat = await this.categoryRepo.findById(cleanCatId);
                if (!cat || String(cat.websiteId) !== websiteId) {
                    throw new AppError(BlogMessages.BLOG_CATEGORY_MISMATCH, 400);
                }
            }
        }

        // Tags check
        if (tagIds && tagIds.length > 0) {
            for (const tId of tagIds) {
                const cleanTagId = idOf(tId);
                const tag = await this.tagRepo.findById(cleanTagId);
                if (!tag || String(tag.websiteId) !== websiteId) {
                    throw new AppError(BlogMessages.BLOG_TAG_MISMATCH, 400);
                }
            }
        }

        // Co-authors check
        if (coAuthorIds && coAuthorIds.length > 0) {
            for (const caId of coAuthorIds) {
                const cleanCoAuthorId = idOf(caId);
                const coAuthor = await this.authorRepo.findById(cleanCoAuthorId);
                if (!coAuthor || String(coAuthor.websiteId) !== websiteId) {
                    throw new AppError("Co-author does not belong to the same website.", 400);
                }
            }
        }
    }

    async createBlog(data: Partial<IBlog>, userId: string, context?: IAuditLogContext) {
        if (!data.websiteId) throw new AppError("Website ID is required.", 400);
        const websiteIdStr = String(data.websiteId);
        await this.validateWebsite(websiteIdStr);

        if (!data.title || !data.title.trim()) throw new AppError(BlogMessages.BLOG_TITLE_REQUIRED, 400);
        if (!data.slug || !data.slug.trim()) throw new AppError(BlogMessages.BLOG_SLUG_REQUIRED, 400);
        if (!data.content) throw new AppError(BlogMessages.BLOG_CONTENT_REQUIRED, 400);
        if (!data.authorId) throw new AppError(BlogMessages.BLOG_AUTHOR_REQUIRED, 400);

        const normalizedSlug = data.slug.toLowerCase().trim();
        if (await this.blogRepo.existsBySlug(websiteIdStr, normalizedSlug)) {
            throw new AppError(BlogMessages.BLOG_SLUG_EXISTS, 409);
        }

        await this.validateReferences(
            websiteIdStr,
            String(data.authorId),
            data.categoryIds,
            data.tagIds,
            data.coAuthorIds,
        );

        // Content analytics
        const plainText = BlogContentUtil.extractPlainText(data.content);
        const wordCount = BlogContentUtil.calculateWordCount(data.content);
        const readingTime = BlogContentUtil.calculateReadingTime(data.content);

        const status = data.status || BlogStatus.DRAFT;
        let publishedAt: Date | null = null;
        let publishedBy: any = null;
        let scheduledAt: Date | null = null;

        if (status === BlogStatus.PUBLISHED) {
            publishedAt = data.publishedAt ? new Date(data.publishedAt) : new Date();
            publishedBy = userId as any;
        } else if (status === BlogStatus.SCHEDULED) {
            if (!data.scheduledAt) throw new AppError(BlogMessages.BLOG_SCHEDULE_DATE_REQUIRED, 400);
            scheduledAt = new Date(data.scheduledAt);
            if (scheduledAt.getTime() <= Date.now()) {
                throw new AppError(BlogMessages.BLOG_CANNOT_SCHEDULE_PAST, 400);
            }
        }

        const blog = await this.blogRepo.create({
            ...data,
            slug: normalizedSlug,
            status,
            publishedAt,
            publishedBy,
            scheduledAt,
            contentRawText: plainText,
            wordCount,
            readingTime,
            createdBy: userId as any,
            updatedBy: userId as any,
        });

        // Create initial Revision 1
        await this.revisionRepo.create({
            websiteId: websiteIdStr,
            blogId: String(blog._id),
            version: 1,
            title: blog.title,
            slug: blog.slug,
            excerpt: blog.excerpt,
            content: blog.content,
            seo: blog.seo,
            changeSummary: "Initial version",
            createdBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.CREATE,
            resourceId: String(blog._id),
            resourceName: blog.title,
            description: `Blog article "${blog.title}" created with status ${status}.`,
        });

        return this.formatBlogResponse(blog);
    }

    async updateBlog(id: string, data: Partial<IBlog>, userId: string, context?: IAuditLogContext) {
        const existing = await this.blogRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.BLOG_NOT_FOUND, 404);

        const websiteIdStr = String(existing.websiteId);

        // Handle slug change & automatic 301 redirect if article was published
        if (data.slug) {
            const normalizedSlug = data.slug.toLowerCase().trim();
            if (normalizedSlug !== existing.slug) {
                if (await this.blogRepo.existsBySlug(websiteIdStr, normalizedSlug, id)) {
                    throw new AppError(BlogMessages.BLOG_SLUG_EXISTS, 409);
                }

                // If previously published, create automatic 301 redirect
                if (existing.status === BlogStatus.PUBLISHED || existing.publishedAt) {
                    try {
                        await this.redirectService.createRedirect(
                            {
                                websiteId: websiteIdStr,
                                sourcePath: `/blog/${existing.slug}`,
                                destinationPath: `/blog/${normalizedSlug}`,
                                redirectType: BlogRedirectType.PERMANENT,
                            },
                            userId,
                            context,
                        );
                    } catch (err: any) {
                        // If redirect exists or fails, don't block the update
                        console.warn("[BlogService] Auto-redirect warning:", err?.message);
                    }
                }
                data.slug = normalizedSlug;
            }
        }

        // Validate references if updated
        const targetAuthorId = data.authorId ? String(data.authorId) : String((existing.authorId as any)?._id || existing.authorId);
        const targetCategoryIds = data.categoryIds || (existing.categoryIds as any[]);
        const targetTagIds = data.tagIds || (existing.tagIds as any[]);
        const targetCoAuthorIds = data.coAuthorIds || (existing.coAuthorIds as any[]);

        await this.validateReferences(
            websiteIdStr,
            targetAuthorId,
            targetCategoryIds,
            targetTagIds,
            targetCoAuthorIds,
        );

        // Recalculate content analytics if content changed
        const updatePayload: Partial<IBlog> = { ...data, updatedBy: userId as any };
        if (data.content) {
            updatePayload.contentRawText = BlogContentUtil.extractPlainText(data.content);
            updatePayload.wordCount = BlogContentUtil.calculateWordCount(data.content);
            updatePayload.readingTime = BlogContentUtil.calculateReadingTime(data.content);
        }

        const updated = await this.blogRepo.update(id, updatePayload);

        // Save new revision
        const latestVersion = await this.revisionRepo.findLatestVersion(id);
        await this.revisionRepo.create({
            websiteId: websiteIdStr,
            blogId: id,
            version: latestVersion + 1,
            title: updated?.title || existing.title,
            slug: updated?.slug || existing.slug,
            excerpt: updated?.excerpt || existing.excerpt,
            content: updated?.content || existing.content,
            seo: updated?.seo || existing.seo,
            changeSummary: (data as any).changeSummary || "Article updated",
            createdBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.UPDATE,
            resourceId: id,
            resourceName: existing.title,
            description: `Blog article "${existing.title}" updated.`,
        });

        return this.formatBlogResponse(updated);
    }

    async publishBlog(id: string, userId: string, context?: IAuditLogContext) {
        const existing = await this.blogRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.BLOG_NOT_FOUND, 404);

        const published = await this.blogRepo.update(id, {
            status: BlogStatus.PUBLISHED,
            publishedAt: existing.publishedAt || new Date(),
            publishedBy: userId as any,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.STATUS_CHANGE,
            resourceId: id,
            resourceName: existing.title,
            description: `Blog article "${existing.title}" published.`,
        });

        return this.formatBlogResponse(published);
    }

    async unpublishBlog(id: string, userId: string, context?: IAuditLogContext) {
        const existing = await this.blogRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.BLOG_NOT_FOUND, 404);

        const unpublished = await this.blogRepo.update(id, {
            status: BlogStatus.DRAFT,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.STATUS_CHANGE,
            resourceId: id,
            resourceName: existing.title,
            description: `Blog article "${existing.title}" unpublished (moved to DRAFT).`,
        });

        return this.formatBlogResponse(unpublished);
    }

    async scheduleBlog(id: string, scheduledAt: Date, userId: string, context?: IAuditLogContext) {
        const existing = await this.blogRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.BLOG_NOT_FOUND, 404);

        const date = new Date(scheduledAt);
        if (isNaN(date.getTime()) || date.getTime() <= Date.now()) {
            throw new AppError(BlogMessages.BLOG_CANNOT_SCHEDULE_PAST, 400);
        }

        const scheduled = await this.blogRepo.update(id, {
            status: BlogStatus.SCHEDULED,
            scheduledAt: date,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.STATUS_CHANGE,
            resourceId: id,
            resourceName: existing.title,
            description: `Blog article "${existing.title}" scheduled for ${date.toISOString()}.`,
        });

        return this.formatBlogResponse(scheduled);
    }

    async archiveBlog(id: string, userId: string, context?: IAuditLogContext) {
        const existing = await this.blogRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.BLOG_NOT_FOUND, 404);

        const archived = await this.blogRepo.update(id, {
            status: BlogStatus.ARCHIVED,
            updatedBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.STATUS_CHANGE,
            resourceId: id,
            resourceName: existing.title,
            description: `Blog article "${existing.title}" archived.`,
        });

        return this.formatBlogResponse(archived);
    }

    async deleteBlog(id: string, userId: string, context?: IAuditLogContext) {
        const existing = await this.blogRepo.findById(id);
        if (!existing) throw new AppError(BlogMessages.BLOG_NOT_FOUND, 404);

        await this.blogRepo.delete(id);

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.DELETE,
            resourceId: id,
            resourceName: existing.title,
            description: `Blog article "${existing.title}" deleted.`,
        });

        return true;
    }

    async getBlogById(id: string) {
        const blog = await this.blogRepo.findById(id);
        if (!blog) throw new AppError(BlogMessages.BLOG_NOT_FOUND, 404);
        return this.formatBlogResponse(blog);
    }

    async getBlogBySlug(websiteId: string, slug: string) {
        const blog = await this.blogRepo.findBySlug(websiteId, slug);
        if (!blog) throw new AppError(BlogMessages.BLOG_NOT_FOUND, 404);
        return this.formatBlogResponse(blog);
    }

    async getPublicBlogBySlug(websiteId: string, slug: string) {
        const website = await this.validateWebsite(websiteId);
        const blog = await this.blogRepo.findPublicBySlug(websiteId, slug);
        if (!blog) throw new AppError(BlogMessages.BLOG_NOT_FOUND, 404);

        // Resolve SEO metadata for public payload
        const seoData = BlogSeoService.resolveArticleSeo(website, blog);

        return this.formatBlogResponse({
            ...blog,
            resolvedSeo: seoData,
        });
    }

    async getBlogs(filter: IBlogFilter = {}, isPublic = false) {
        const result = await this.blogRepo.findAll(filter, isPublic);
        return {
            ...result,
            data: result.data.map((b: any) => this.formatBlogResponse(b)),
        };
    }

    async getRelatedBlogs(websiteId: string, blogId: string, limit = 4) {
        const blog = await this.blogRepo.findById(blogId);
        if (!blog) throw new AppError(BlogMessages.BLOG_NOT_FOUND, 404);

        const list = await this.blogRepo.findRelated(
            websiteId,
            blogId,
            blog.categoryIds as any[],
            blog.tagIds as any[],
            limit,
        );
        return list.map((b: any) => this.formatBlogResponse(b));
    }

    async getRevisions(blogId: string) {
        return this.revisionRepo.findByBlogId(blogId);
    }

    async restoreRevision(blogId: string, revisionId: string, userId: string, context?: IAuditLogContext) {
        const blog = await this.blogRepo.findById(blogId);
        if (!blog) throw new AppError(BlogMessages.BLOG_NOT_FOUND, 404);

        const revision = await this.revisionRepo.findById(revisionId);
        if (!revision || String(revision.blogId) !== blogId) {
            throw new AppError(BlogMessages.REVISION_NOT_FOUND, 404);
        }

        const plainText = BlogContentUtil.extractPlainText(revision.content);
        const wordCount = BlogContentUtil.calculateWordCount(revision.content);
        const readingTime = BlogContentUtil.calculateReadingTime(revision.content);

        const updated = await this.blogRepo.update(blogId, {
            title: revision.title,
            slug: revision.slug,
            excerpt: revision.excerpt,
            content: revision.content,
            contentRawText: plainText,
            wordCount,
            readingTime,
            seo: revision.seo,
            updatedBy: userId as any,
        });

        // Creating a new revision snapshot for audit integrity
        const latestVersion = await this.revisionRepo.findLatestVersion(blogId);
        await this.revisionRepo.create({
            websiteId: String(blog.websiteId),
            blogId,
            version: latestVersion + 1,
            title: revision.title,
            slug: revision.slug,
            excerpt: revision.excerpt,
            content: revision.content,
            seo: revision.seo,
            changeSummary: `Restored from version ${revision.version}`,
            createdBy: userId as any,
        });

        await this.auditLogService.log({
            ...(context || {}),
            module: AppModule.BLOG,
            action: AuditLogAction.UPDATE,
            resourceId: blogId,
            resourceName: blog.title,
            description: `Blog article "${blog.title}" restored to revision ${revision.version}.`,
        });

        return this.formatBlogResponse(updated);
    }
}


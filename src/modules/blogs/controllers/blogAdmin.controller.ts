import type { Request, Response, NextFunction } from "express";
import { BaseController } from "../../../utils/controllers/base.controller.js";
import { ResponseUtil } from "../../../utils/response.util.js";
import { BlogWebsiteService } from "../services/blogWebsite.service.js";
import { BlogCategoryService } from "../services/blogCategory.service.js";
import { BlogTagService } from "../services/blogTag.service.js";
import { BlogAuthorService } from "../services/blogAuthor.service.js";
import { BlogService } from "../services/blog.service.js";
import { BlogRedirectService } from "../services/blogRedirect.service.js";
import { BlogMessages } from "../constants/blog.messages.js";
import type { IAuditLogContext } from "../../auditlog/interfaces/auditLog.interface.js";

export class BlogAdminController extends BaseController {
    private websiteService: BlogWebsiteService;
    private categoryService: BlogCategoryService;
    private tagService: BlogTagService;
    private authorService: BlogAuthorService;
    private blogService: BlogService;
    private redirectService: BlogRedirectService;

    constructor() {
        super();
        this.websiteService = new BlogWebsiteService();
        this.categoryService = new BlogCategoryService();
        this.tagService = new BlogTagService();
        this.authorService = new BlogAuthorService();
        this.blogService = new BlogService();
        this.redirectService = new BlogRedirectService();
    }

    private getAuditContext(req: Request): IAuditLogContext {
        const userId = req.user?.id;
        return {
            actorId: userId ? (userId as any) : null,
            ipAddress: req.ip || null,
            userAgent: req.headers["user-agent"] || null,
        };
    }

    // --- Website Management ---
    createWebsite = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const website = await this.websiteService.createWebsite(
                req.body,
                req.user?.id,
                this.getAuditContext(req),
            );
            return res.status(201).json(ResponseUtil.created(BlogMessages.WEBSITE_CREATED, website));
        } catch (error) {
            next(error);
        }
    };

    updateWebsite = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const website = await this.websiteService.updateWebsite(
                id,
                req.body,
                req.user?.id,
                this.getAuditContext(req),
            );
            return res.status(200).json(ResponseUtil.success(BlogMessages.WEBSITE_UPDATED, website));
        } catch (error) {
            next(error);
        }
    };

    getWebsiteById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const website = await this.websiteService.getWebsiteById(id);
            return res.status(200).json(ResponseUtil.success(BlogMessages.WEBSITE_FETCHED, website));
        } catch (error) {
            next(error);
        }
    };

    getWebsites = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.websiteService.getWebsites(req.query as any);
            return res.status(200).json(
                ResponseUtil.paginated(
                    BlogMessages.WEBSITE_FETCHED_ALL,
                    result.data,
                    result.pagination.page,
                    result.pagination.limit,
                    result.pagination.total,
                ),
            );
        } catch (error) {
            next(error);
        }
    };

    updateWebsiteStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const website = await this.websiteService.updateStatus(
                id,
                req.body.status,
                req.user?.id,
                this.getAuditContext(req),
            );
            return res.status(200).json(ResponseUtil.success(BlogMessages.WEBSITE_STATUS_UPDATED, website));
        } catch (error) {
            next(error);
        }
    };

    // --- Category Management ---
    createCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const category = await this.categoryService.createCategory(
                req.body,
                req.user?.id,
                this.getAuditContext(req),
            );
            return res.status(201).json(ResponseUtil.created(BlogMessages.CATEGORY_CREATED, category));
        } catch (error) {
            next(error);
        }
    };

    updateCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const category = await this.categoryService.updateCategory(
                id,
                req.body,
                req.user?.id,
                this.getAuditContext(req),
            );
            return res.status(200).json(ResponseUtil.success(BlogMessages.CATEGORY_UPDATED, category));
        } catch (error) {
            next(error);
        }
    };

    deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            await this.categoryService.deleteCategory(
                id,
                req.body.reassignedCategoryId,
                req.user?.id,
                this.getAuditContext(req),
            );
            return res.status(200).json(ResponseUtil.success(BlogMessages.CATEGORY_DELETED));
        } catch (error) {
            next(error);
        }
    };

    getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const category = await this.categoryService.getCategoryById(id);
            return res.status(200).json(ResponseUtil.success(BlogMessages.CATEGORY_FETCHED, category));
        } catch (error) {
            next(error);
        }
    };

    getCategories = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.categoryService.getCategories(req.query as any);
            return res.status(200).json(
                ResponseUtil.paginated(
                    BlogMessages.CATEGORY_FETCHED_ALL,
                    result.data,
                    result.pagination.page,
                    result.pagination.limit,
                    result.pagination.total,
                ),
            );
        } catch (error) {
            next(error);
        }
    };

    // --- Tag Management ---
    createTag = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tag = await this.tagService.createTag(
                req.body,
                req.user?.id,
                this.getAuditContext(req),
            );
            return res.status(201).json(ResponseUtil.created(BlogMessages.TAG_CREATED, tag));
        } catch (error) {
            next(error);
        }
    };

    updateTag = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const tag = await this.tagService.updateTag(
                id,
                req.body,
                req.user?.id,
                this.getAuditContext(req),
            );
            return res.status(200).json(ResponseUtil.success(BlogMessages.TAG_UPDATED, tag));
        } catch (error) {
            next(error);
        }
    };

    deleteTag = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            await this.tagService.deleteTag(id, req.user?.id, this.getAuditContext(req));
            return res.status(200).json(ResponseUtil.success(BlogMessages.TAG_DELETED));
        } catch (error) {
            next(error);
        }
    };

    getTagById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const tag = await this.tagService.getTagById(id);
            return res.status(200).json(ResponseUtil.success(BlogMessages.TAG_FETCHED, tag));
        } catch (error) {
            next(error);
        }
    };

    getTags = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.tagService.getTags(req.query as any);
            return res.status(200).json(
                ResponseUtil.paginated(
                    BlogMessages.TAG_FETCHED_ALL,
                    result.data,
                    result.pagination.page,
                    result.pagination.limit,
                    result.pagination.total,
                ),
            );
        } catch (error) {
            next(error);
        }
    };

    // --- Author Management ---
    createAuthor = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const author = await this.authorService.createAuthor(
                req.body,
                req.user?.id,
                this.getAuditContext(req),
            );
            return res.status(201).json(ResponseUtil.created(BlogMessages.AUTHOR_CREATED, author));
        } catch (error) {
            next(error);
        }
    };

    updateAuthor = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const author = await this.authorService.updateAuthor(
                id,
                req.body,
                req.user?.id,
                this.getAuditContext(req),
            );
            return res.status(200).json(ResponseUtil.success(BlogMessages.AUTHOR_UPDATED, author));
        } catch (error) {
            next(error);
        }
    };

    deleteAuthor = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            await this.authorService.deleteAuthor(id, req.user?.id, this.getAuditContext(req));
            return res.status(200).json(ResponseUtil.success(BlogMessages.AUTHOR_DELETED));
        } catch (error) {
            next(error);
        }
    };

    getAuthorById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const author = await this.authorService.getAuthorById(id);
            return res.status(200).json(ResponseUtil.success(BlogMessages.AUTHOR_FETCHED, author));
        } catch (error) {
            next(error);
        }
    };

    getAuthors = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.authorService.getAuthors(req.query as any);
            return res.status(200).json(
                ResponseUtil.paginated(
                    BlogMessages.AUTHOR_FETCHED_ALL,
                    result.data,
                    result.pagination.page,
                    result.pagination.limit,
                    result.pagination.total,
                ),
            );
        } catch (error) {
            next(error);
        }
    };

    // --- Blog Management ---
    createBlog = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const blog = await this.blogService.createBlog(
                req.body,
                req.user?.id as string,
                this.getAuditContext(req),
            );
            return res.status(201).json(ResponseUtil.created(BlogMessages.BLOG_CREATED, blog));
        } catch (error) {
            next(error);
        }
    };

    updateBlog = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const blog = await this.blogService.updateBlog(
                id,
                req.body,
                req.user?.id as string,
                this.getAuditContext(req),
            );
            return res.status(200).json(ResponseUtil.success(BlogMessages.BLOG_UPDATED, blog));
        } catch (error) {
            next(error);
        }
    };

    deleteBlog = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            await this.blogService.deleteBlog(id, req.user?.id as string, this.getAuditContext(req));
            return res.status(200).json(ResponseUtil.success(BlogMessages.BLOG_DELETED));
        } catch (error) {
            next(error);
        }
    };

    getBlogById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const blog = await this.blogService.getBlogById(id);
            return res.status(200).json(ResponseUtil.success(BlogMessages.BLOG_FETCHED, blog));
        } catch (error) {
            next(error);
        }
    };

    getBlogs = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.blogService.getBlogs(req.query as any, false);
            return res.status(200).json(
                ResponseUtil.paginated(
                    BlogMessages.BLOG_FETCHED_ALL,
                    result.data,
                    result.pagination.page,
                    result.pagination.limit,
                    result.pagination.total,
                ),
            );
        } catch (error) {
            next(error);
        }
    };

    publishBlog = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const blog = await this.blogService.publishBlog(id, req.user?.id as string, this.getAuditContext(req));
            return res.status(200).json(ResponseUtil.success(BlogMessages.BLOG_PUBLISHED, blog));
        } catch (error) {
            next(error);
        }
    };

    unpublishBlog = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const blog = await this.blogService.unpublishBlog(id, req.user?.id as string, this.getAuditContext(req));
            return res.status(200).json(ResponseUtil.success(BlogMessages.BLOG_UNPUBLISHED, blog));
        } catch (error) {
            next(error);
        }
    };

    scheduleBlog = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const blog = await this.blogService.scheduleBlog(
                id,
                req.body.scheduledAt,
                req.user?.id as string,
                this.getAuditContext(req),
            );
            return res.status(200).json(ResponseUtil.success(BlogMessages.BLOG_SCHEDULED, blog));
        } catch (error) {
            next(error);
        }
    };

    archiveBlog = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const blog = await this.blogService.archiveBlog(id, req.user?.id as string, this.getAuditContext(req));
            return res.status(200).json(ResponseUtil.success(BlogMessages.BLOG_ARCHIVED, blog));
        } catch (error) {
            next(error);
        }
    };

    previewBlog = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const blog = await this.blogService.getBlogById(id);
            return res.status(200).json(ResponseUtil.success(BlogMessages.BLOG_PREVIEW_FETCHED, blog));
        } catch (error) {
            next(error);
        }
    };

    getRevisions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const revisions = await this.blogService.getRevisions(id);
            return res.status(200).json(ResponseUtil.success(BlogMessages.REVISION_FETCHED_ALL, revisions));
        } catch (error) {
            next(error);
        }
    };

    restoreRevision = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const revisionId = this.getParam(req.params.revisionId);
            const blog = await this.blogService.restoreRevision(
                id,
                revisionId,
                req.user?.id as string,
                this.getAuditContext(req),
            );
            return res.status(200).json(ResponseUtil.success(BlogMessages.REVISION_RESTORED, blog));
        } catch (error) {
            next(error);
        }
    };

    // --- Redirect Management ---
    createRedirect = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const redirect = await this.redirectService.createRedirect(
                req.body,
                req.user?.id,
                this.getAuditContext(req),
            );
            return res.status(201).json(ResponseUtil.created(BlogMessages.REDIRECT_CREATED, redirect));
        } catch (error) {
            next(error);
        }
    };

    updateRedirect = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            const redirect = await this.redirectService.updateRedirect(
                id,
                req.body,
                req.user?.id,
                this.getAuditContext(req),
            );
            return res.status(200).json(ResponseUtil.success(BlogMessages.REDIRECT_UPDATED, redirect));
        } catch (error) {
            next(error);
        }
    };

    deleteRedirect = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = this.getParam(req.params.id);
            await this.redirectService.deleteRedirect(id, req.user?.id, this.getAuditContext(req));
            return res.status(200).json(ResponseUtil.success(BlogMessages.REDIRECT_DELETED));
        } catch (error) {
            next(error);
        }
    };

    getRedirects = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.redirectService.getRedirects(req.query as any);
            return res.status(200).json(
                ResponseUtil.paginated(
                    BlogMessages.REDIRECT_FETCHED_ALL,
                    result.data,
                    result.pagination.page,
                    result.pagination.limit,
                    result.pagination.total,
                ),
            );
        } catch (error) {
            next(error);
        }
    };
}


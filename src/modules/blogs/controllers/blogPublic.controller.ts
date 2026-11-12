import type { Request, Response, NextFunction } from "express";
import { BaseController } from "../../../utils/controllers/base.controller.js";
import { ResponseUtil } from "../../../utils/response.util.js";
import { BlogWebsiteService } from "../services/blogWebsite.service.js";
import { BlogCategoryService } from "../services/blogCategory.service.js";
import { BlogTagService } from "../services/blogTag.service.js";
import { BlogAuthorService } from "../services/blogAuthor.service.js";
import { BlogService } from "../services/blog.service.js";
import { BlogRedirectService } from "../services/blogRedirect.service.js";
import { BlogSeoService } from "../services/blogSeo.service.js";
import { BlogSitemapService } from "../services/blogSitemap.service.js";
import { BlogMessages } from "../constants/blog.messages.js";
import {
    BlogAuthorStatus,
    BlogCategoryStatus,
    BlogTagStatus,
    BlogWebsiteStatus,
} from "../constants/blog.enums.js";

export class BlogPublicController extends BaseController {
    private websiteService: BlogWebsiteService;
    private categoryService: BlogCategoryService;
    private tagService: BlogTagService;
    private authorService: BlogAuthorService;
    private blogService: BlogService;
    private redirectService: BlogRedirectService;
    private sitemapService: BlogSitemapService;

    constructor() {
        super();
        this.websiteService = new BlogWebsiteService();
        this.categoryService = new BlogCategoryService();
        this.tagService = new BlogTagService();
        this.authorService = new BlogAuthorService();
        this.blogService = new BlogService();
        this.redirectService = new BlogRedirectService();
        this.sitemapService = new BlogSitemapService();
    }

    private getWebsite(res: Response) {
        return res.locals.blogWebsite;
    }

    private getWebsiteId(res: Response): string {
        return res.locals.blogWebsiteId;
    }

    // --- Website ---
    getWebsites = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.websiteService.getWebsites({
                status: BlogWebsiteStatus.ACTIVE,
                limit: 50,
            });
            return res.status(200).json(ResponseUtil.success(BlogMessages.WEBSITE_FETCHED_ALL, result.data));
        } catch (error) {
            next(error);
        }
    };

    getWebsiteBySlug = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const slug = this.getParam(req.params.websiteSlug);
            const website = await this.websiteService.getWebsiteBySlug(slug);
            const homeSeo = BlogSeoService.resolveHomeSeo(website);
            return res.status(200).json(
                ResponseUtil.success(BlogMessages.WEBSITE_FETCHED, {
                    ...website,
                    resolvedSeo: homeSeo,
                }),
            );
        } catch (error) {
            next(error);
        }
    };

    // --- Articles ---
    getArticles = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const websiteId = this.getWebsiteId(res);
            const query: any = {
                ...req.query,
                websiteId,
            };

            const result = await this.blogService.getBlogs(query, true);
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

    getArticleBySlug = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const websiteId = this.getWebsiteId(res);
            const slug = this.getParam(req.params.slug);
            const article = await this.blogService.getPublicBlogBySlug(websiteId, slug);
            return res.status(200).json(ResponseUtil.success(BlogMessages.BLOG_FETCHED, article));
        } catch (error) {
            next(error);
        }
    };

    searchArticles = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const websiteId = this.getWebsiteId(res);
            const search = (req.query.q || req.query.search || "") as string;
            const result = await this.blogService.getBlogs(
                {
                    websiteId,
                    search,
                    page: Number(req.query.page) || 1,
                    limit: Math.min(Number(req.query.limit) || 10, 50),
                },
                true,
            );
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

    getRelatedArticles = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const websiteId = this.getWebsiteId(res);
            const blogId = this.getParam(req.params.blogId);
            const related = await this.blogService.getRelatedBlogs(
                websiteId,
                blogId,
                Number(req.query.limit) || 4,
            );
            return res.status(200).json(ResponseUtil.success("Related articles fetched.", related));
        } catch (error) {
            next(error);
        }
    };

    // --- Categories ---
    getCategories = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const websiteId = this.getWebsiteId(res);
            const result = await this.categoryService.getCategories({
                ...req.query,
                websiteId,
                status: BlogCategoryStatus.ACTIVE,
            });
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

    getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const website = this.getWebsite(res);
            const websiteId = this.getWebsiteId(res);
            const slug = this.getParam(req.params.slug);
            const category = await this.categoryService.getCategoryBySlug(websiteId, slug);
            const seo = BlogSeoService.resolveCategorySeo(website, category);

            return res.status(200).json(
                ResponseUtil.success(BlogMessages.CATEGORY_FETCHED, {
                    ...category,
                    resolvedSeo: seo,
                }),
            );
        } catch (error) {
            next(error);
        }
    };

    // --- Tags ---
    getTags = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const websiteId = this.getWebsiteId(res);
            const result = await this.tagService.getTags({
                ...req.query,
                websiteId,
                status: BlogTagStatus.ACTIVE,
            });
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

    getTagBySlug = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const website = this.getWebsite(res);
            const websiteId = this.getWebsiteId(res);
            const slug = this.getParam(req.params.slug);
            const tag = await this.tagService.getTagBySlug(websiteId, slug);
            const seo = BlogSeoService.resolveTagSeo(website, tag);

            return res.status(200).json(
                ResponseUtil.success(BlogMessages.TAG_FETCHED, {
                    ...tag,
                    resolvedSeo: seo,
                }),
            );
        } catch (error) {
            next(error);
        }
    };

    // --- Authors ---
    getAuthors = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const websiteId = this.getWebsiteId(res);
            const result = await this.authorService.getAuthors({
                ...req.query,
                websiteId,
                status: BlogAuthorStatus.ACTIVE,
            });

            // Strip any internal fields for public safety
            const publicAuthors = result.data.map((a: any) => ({
                id: a._id,
                _id: a._id,
                name: a.name,
                slug: a.slug,
                designation: a.designation,
                biography: a.biography,
                profileImageMediaId: a.profileImageMediaId,
                socialLinks: a.socialLinks,
            }));

            return res.status(200).json(
                ResponseUtil.paginated(
                    BlogMessages.AUTHOR_FETCHED_ALL,
                    publicAuthors,
                    result.pagination.page,
                    result.pagination.limit,
                    result.pagination.total,
                ),
            );
        } catch (error) {
            next(error);
        }
    };

    getAuthorBySlug = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const website = this.getWebsite(res);
            const websiteId = this.getWebsiteId(res);
            const slug = this.getParam(req.params.slug);
            const author: any = await this.authorService.getAuthorBySlug(websiteId, slug);
            const seo = BlogSeoService.resolveAuthorSeo(website, author);

            const publicAuthor = {
                id: author._id,
                _id: author._id,
                name: author.name,
                slug: author.slug,
                designation: author.designation,
                biography: author.biography,
                profileImageMediaId: author.profileImageMediaId,
                socialLinks: author.socialLinks,
                resolvedSeo: seo,
            };

            return res.status(200).json(ResponseUtil.success(BlogMessages.AUTHOR_FETCHED, publicAuthor));
        } catch (error) {
            next(error);
        }
    };

    // --- Redirect Lookup ---
    resolveRedirect = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const websiteId = this.getWebsiteId(res);
            const path = (req.query.path as string) || "";
            const redirect = await this.redirectService.resolveRedirect(websiteId, path);

            if (!redirect) {
                return res.status(404).json(ResponseUtil.notFound(BlogMessages.REDIRECT_NOT_FOUND));
            }

            return res.status(200).json(ResponseUtil.success(BlogMessages.REDIRECT_RESOLVED, redirect));
        } catch (error) {
            next(error);
        }
    };

    // --- Sitemap & Robots ---
    getSitemap = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const website = this.getWebsite(res);
            const xml = await this.sitemapService.generateXmlSitemap(website);
            res.header("Content-Type", "application/xml");
            return res.status(200).send(xml);
        } catch (error) {
            next(error);
        }
    };

    getRobotsTxt = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const website = this.getWebsite(res);
            const text = this.sitemapService.generateRobotsTxt(website);
            res.header("Content-Type", "text/plain");
            return res.status(200).send(text);
        } catch (error) {
            next(error);
        }
    };
}


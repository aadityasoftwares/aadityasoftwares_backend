import { Router } from "express";
import { BlogPublicController } from "../controllers/blogPublic.controller.js";
import { resolveWebsite } from "../validations/resolveWebsite.middleware.js";
import { validateId } from "../../../utils/validations/validateId.validation.js";

const router = Router();
const controller = new BlogPublicController();

// 1. Unscoped public website discovery
router.get("/websites", controller.getWebsites);
router.get("/websites/:websiteSlug", controller.getWebsiteBySlug);

// 2. Website-scoped public endpoints (resolved via header, host, or query)
router.use(resolveWebsite);

router.get("/sitemap.xml", controller.getSitemap);
router.get("/robots.txt", controller.getRobotsTxt);
router.get("/search", controller.searchArticles);
router.get("/related/:blogId", validateId, controller.getRelatedArticles);
router.get("/redirects/lookup", controller.resolveRedirect);

// Categories
router.get("/categories", controller.getCategories);
router.get("/categories/:slug", controller.getCategoryBySlug);

// Tags
router.get("/tags", controller.getTags);
router.get("/tags/:slug", controller.getTagBySlug);

// Authors
router.get("/authors", controller.getAuthors);
router.get("/authors/:slug", controller.getAuthorBySlug);

// Article list and single article
router.get("/", controller.getArticles);
router.get("/:slug", controller.getArticleBySlug);

export default router;


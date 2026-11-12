import { Router } from "express";
import { BlogAdminController } from "../controllers/blogAdmin.controller.js";
import { authMiddleware } from "../../../middlewares/authmiddleware/auth.middleware.js";
import { requirePermission } from "../../permissions/middlewares/permission.middleware.js";
import { PermissionAction, PermissionModule } from "../../permissions/constants/permission.enums.js";
import { validateId } from "../../../utils/validations/validateId.validation.js";
import { validatePagination } from "../../../utils/validations/validatePagination.js";
import {
    createWebsiteValidation,
    updateWebsiteValidation,
} from "../validations/website.validation.js";
import {
    createCategoryValidation,
    updateCategoryValidation,
} from "../validations/category.validation.js";
import {
    createTagValidation,
    updateTagValidation,
} from "../validations/tag.validation.js";
import {
    createAuthorValidation,
    updateAuthorValidation,
} from "../validations/author.validation.js";
import {
    createBlogValidation,
    updateBlogValidation,
    scheduleBlogValidation,
} from "../validations/blog.validation.js";
import {
    createRedirectValidation,
    updateRedirectValidation,
} from "../validations/redirect.validation.js";

const router = Router();
const controller = new BlogAdminController();

router.use(authMiddleware);

// --- Websites ---
router.post(
    "/websites",
    requirePermission(PermissionModule.BLOG, PermissionAction.CREATE),
    createWebsiteValidation,
    controller.createWebsite,
);
router.get(
    "/websites",
    requirePermission(PermissionModule.BLOG, PermissionAction.READ),
    validatePagination(),
    controller.getWebsites,
);
router.get(
    "/websites/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.READ),
    validateId,
    controller.getWebsiteById,
);
router.put(
    "/websites/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.UPDATE),
    validateId,
    updateWebsiteValidation,
    controller.updateWebsite,
);
router.patch(
    "/websites/:id/status",
    requirePermission(PermissionModule.BLOG, PermissionAction.UPDATE),
    validateId,
    controller.updateWebsiteStatus,
);

// --- Categories ---
router.post(
    "/categories",
    requirePermission(PermissionModule.BLOG, PermissionAction.CREATE),
    createCategoryValidation,
    controller.createCategory,
);
router.get(
    "/categories",
    requirePermission(PermissionModule.BLOG, PermissionAction.READ),
    validatePagination(),
    controller.getCategories,
);
router.get(
    "/categories/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.READ),
    validateId,
    controller.getCategoryById,
);
router.put(
    "/categories/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.UPDATE),
    validateId,
    updateCategoryValidation,
    controller.updateCategory,
);
router.delete(
    "/categories/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.DELETE),
    validateId,
    controller.deleteCategory,
);

// --- Tags ---
router.post(
    "/tags",
    requirePermission(PermissionModule.BLOG, PermissionAction.CREATE),
    createTagValidation,
    controller.createTag,
);
router.get(
    "/tags",
    requirePermission(PermissionModule.BLOG, PermissionAction.READ),
    validatePagination(),
    controller.getTags,
);
router.get(
    "/tags/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.READ),
    validateId,
    controller.getTagById,
);
router.put(
    "/tags/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.UPDATE),
    validateId,
    updateTagValidation,
    controller.updateTag,
);
router.delete(
    "/tags/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.DELETE),
    validateId,
    controller.deleteTag,
);

// --- Authors ---
router.post(
    "/authors",
    requirePermission(PermissionModule.BLOG, PermissionAction.CREATE),
    createAuthorValidation,
    controller.createAuthor,
);
router.get(
    "/authors",
    requirePermission(PermissionModule.BLOG, PermissionAction.READ),
    validatePagination(),
    controller.getAuthors,
);
router.get(
    "/authors/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.READ),
    validateId,
    controller.getAuthorById,
);
router.put(
    "/authors/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.UPDATE),
    validateId,
    updateAuthorValidation,
    controller.updateAuthor,
);
router.delete(
    "/authors/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.DELETE),
    validateId,
    controller.deleteAuthor,
);

// --- Redirects ---
router.post(
    "/redirects",
    requirePermission(PermissionModule.BLOG, PermissionAction.CREATE),
    createRedirectValidation,
    controller.createRedirect,
);
router.get(
    "/redirects",
    requirePermission(PermissionModule.BLOG, PermissionAction.READ),
    validatePagination(),
    controller.getRedirects,
);
router.put(
    "/redirects/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.UPDATE),
    validateId,
    updateRedirectValidation,
    controller.updateRedirect,
);
router.delete(
    "/redirects/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.DELETE),
    validateId,
    controller.deleteRedirect,
);

// --- Blogs / Articles ---
router.post(
    "/",
    requirePermission(PermissionModule.BLOG, PermissionAction.CREATE),
    createBlogValidation,
    controller.createBlog,
);
router.get(
    "/",
    requirePermission(PermissionModule.BLOG, PermissionAction.READ),
    validatePagination(),
    controller.getBlogs,
);
router.get(
    "/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.READ),
    validateId,
    controller.getBlogById,
);
router.put(
    "/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.UPDATE),
    validateId,
    updateBlogValidation,
    controller.updateBlog,
);
router.delete(
    "/:id",
    requirePermission(PermissionModule.BLOG, PermissionAction.DELETE),
    validateId,
    controller.deleteBlog,
);

router.post(
    "/:id/publish",
    requirePermission(PermissionModule.BLOG, PermissionAction.PUBLISH),
    validateId,
    controller.publishBlog,
);
router.post(
    "/:id/unpublish",
    requirePermission(PermissionModule.BLOG, PermissionAction.PUBLISH),
    validateId,
    controller.unpublishBlog,
);
router.post(
    "/:id/schedule",
    requirePermission(PermissionModule.BLOG, PermissionAction.PUBLISH),
    validateId,
    scheduleBlogValidation,
    controller.scheduleBlog,
);
router.post(
    "/:id/archive",
    requirePermission(PermissionModule.BLOG, PermissionAction.PUBLISH),
    validateId,
    controller.archiveBlog,
);
router.get(
    "/:id/preview",
    requirePermission(PermissionModule.BLOG, PermissionAction.READ),
    validateId,
    controller.previewBlog,
);
router.get(
    "/:id/revisions",
    requirePermission(PermissionModule.BLOG, PermissionAction.READ),
    validateId,
    controller.getRevisions,
);
router.post(
    "/:id/revisions/:revisionId/restore",
    requirePermission(PermissionModule.BLOG, PermissionAction.UPDATE),
    validateId,
    controller.restoreRevision,
);

export default router;


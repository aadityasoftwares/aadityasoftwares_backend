import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../utils/errors/app.error.js";
import { BlogMessages } from "../constants/blog.messages.js";
import { BlogStatus, BlogContentFormat } from "../constants/blog.enums.js";
import { Types } from "mongoose";

export const createBlogValidation = (req: Request, _res: Response, next: NextFunction) => {
    const {
        websiteId,
        title,
        slug,
        excerpt,
        content,
        contentFormat,
        authorId,
        categoryIds,
        tagIds,
        status,
        scheduledAt,
        featuredImageMediaId,
    } = req.body;

    if (!websiteId || !Types.ObjectId.isValid(String(websiteId))) {
        throw new AppError("Valid websiteId is required.", 400);
    }
    if (!title || typeof title !== "string" || !title.trim()) {
        throw new AppError(BlogMessages.BLOG_TITLE_REQUIRED, 400);
    }
    if (!slug || typeof slug !== "string" || !slug.trim()) {
        throw new AppError(BlogMessages.BLOG_SLUG_REQUIRED, 400);
    }
    if (!excerpt || typeof excerpt !== "string" || !excerpt.trim()) {
        throw new AppError("Article excerpt is required.", 400);
    }
    if (!content) {
        throw new AppError(BlogMessages.BLOG_CONTENT_REQUIRED, 400);
    }
    if (contentFormat && !Object.values(BlogContentFormat).includes(contentFormat)) {
        throw new AppError("Invalid content format. Supported: JSON, DELTA, HTML.", 400);
    }
    if (!authorId || !Types.ObjectId.isValid(String(authorId))) {
        throw new AppError(BlogMessages.BLOG_AUTHOR_REQUIRED, 400);
    }
    if (featuredImageMediaId && !Types.ObjectId.isValid(String(featuredImageMediaId))) {
        throw new AppError("Invalid featuredImageMediaId format.", 400);
    }

    if (categoryIds && Array.isArray(categoryIds)) {
        for (const catId of categoryIds) {
            if (!Types.ObjectId.isValid(String(catId))) {
                throw new AppError("Invalid category ID in categoryIds list.", 400);
            }
        }
    }

    if (tagIds && Array.isArray(tagIds)) {
        for (const tId of tagIds) {
            if (!Types.ObjectId.isValid(String(tId))) {
                throw new AppError("Invalid tag ID in tagIds list.", 400);
            }
        }
    }

    if (status && !Object.values(BlogStatus).includes(status)) {
        throw new AppError("Invalid blog status.", 400);
    }

    if (status === BlogStatus.SCHEDULED) {
        if (!scheduledAt) throw new AppError(BlogMessages.BLOG_SCHEDULE_DATE_REQUIRED, 400);
        const date = new Date(scheduledAt);
        if (isNaN(date.getTime()) || date.getTime() <= Date.now()) {
            throw new AppError(BlogMessages.BLOG_CANNOT_SCHEDULE_PAST, 400);
        }
    }

    next();
};

export const updateBlogValidation = (req: Request, _res: Response, next: NextFunction) => {
    const {
        title,
        slug,
        authorId,
        categoryIds,
        tagIds,
        featuredImageMediaId,
        status,
        scheduledAt,
    } = req.body;

    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
        throw new AppError(BlogMessages.BLOG_TITLE_REQUIRED, 400);
    }
    if (slug !== undefined && (typeof slug !== "string" || !slug.trim())) {
        throw new AppError(BlogMessages.BLOG_SLUG_REQUIRED, 400);
    }
    if (authorId !== undefined && !Types.ObjectId.isValid(String(authorId))) {
        throw new AppError(BlogMessages.BLOG_AUTHOR_REQUIRED, 400);
    }
    if (featuredImageMediaId && !Types.ObjectId.isValid(String(featuredImageMediaId))) {
        throw new AppError("Invalid featuredImageMediaId format.", 400);
    }

    if (categoryIds && Array.isArray(categoryIds)) {
        for (const catId of categoryIds) {
            if (!Types.ObjectId.isValid(String(catId))) {
                throw new AppError("Invalid category ID in categoryIds list.", 400);
            }
        }
    }

    if (tagIds && Array.isArray(tagIds)) {
        for (const tId of tagIds) {
            if (!Types.ObjectId.isValid(String(tId))) {
                throw new AppError("Invalid tag ID in tagIds list.", 400);
            }
        }
    }

    if (status && !Object.values(BlogStatus).includes(status)) {
        throw new AppError("Invalid blog status.", 400);
    }

    if (status === BlogStatus.SCHEDULED && scheduledAt) {
        const date = new Date(scheduledAt);
        if (isNaN(date.getTime()) || date.getTime() <= Date.now()) {
            throw new AppError(BlogMessages.BLOG_CANNOT_SCHEDULE_PAST, 400);
        }
    }

    next();
};

export const scheduleBlogValidation = (req: Request, _res: Response, next: NextFunction) => {
    const { scheduledAt } = req.body;
    if (!scheduledAt) {
        throw new AppError(BlogMessages.BLOG_SCHEDULE_DATE_REQUIRED, 400);
    }
    const date = new Date(scheduledAt);
    if (isNaN(date.getTime()) || date.getTime() <= Date.now()) {
        throw new AppError(BlogMessages.BLOG_CANNOT_SCHEDULE_PAST, 400);
    }
    next();
};


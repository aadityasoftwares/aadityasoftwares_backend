import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../utils/errors/app.error.js";
import { BlogMessages } from "../constants/blog.messages.js";
import { BlogCategoryStatus } from "../constants/blog.enums.js";
import { Types } from "mongoose";

export const createCategoryValidation = (req: Request, _res: Response, next: NextFunction) => {
    const { websiteId, name, slug, parentCategoryId, status } = req.body;

    if (!websiteId || !Types.ObjectId.isValid(String(websiteId))) {
        throw new AppError("Valid websiteId is required.", 400);
    }
    if (!name || typeof name !== "string" || !name.trim()) {
        throw new AppError(BlogMessages.CATEGORY_NAME_REQUIRED, 400);
    }
    if (!slug || typeof slug !== "string" || !slug.trim()) {
        throw new AppError(BlogMessages.CATEGORY_SLUG_REQUIRED, 400);
    }
    if (parentCategoryId && !Types.ObjectId.isValid(String(parentCategoryId))) {
        throw new AppError("Invalid parentCategoryId format.", 400);
    }
    if (status && !Object.values(BlogCategoryStatus).includes(status)) {
        throw new AppError("Invalid category status.", 400);
    }

    next();
};

export const updateCategoryValidation = (req: Request, _res: Response, next: NextFunction) => {
    const { name, slug, parentCategoryId, status } = req.body;

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        throw new AppError(BlogMessages.CATEGORY_NAME_REQUIRED, 400);
    }
    if (slug !== undefined && (typeof slug !== "string" || !slug.trim())) {
        throw new AppError(BlogMessages.CATEGORY_SLUG_REQUIRED, 400);
    }
    if (parentCategoryId && !Types.ObjectId.isValid(String(parentCategoryId))) {
        throw new AppError("Invalid parentCategoryId format.", 400);
    }
    if (status && !Object.values(BlogCategoryStatus).includes(status)) {
        throw new AppError("Invalid category status.", 400);
    }

    next();
};


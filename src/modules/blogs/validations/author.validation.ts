import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../utils/errors/app.error.js";
import { BlogMessages } from "../constants/blog.messages.js";
import { BlogAuthorStatus } from "../constants/blog.enums.js";
import { Types } from "mongoose";

export const createAuthorValidation = (req: Request, _res: Response, next: NextFunction) => {
    const { websiteId, name, slug, userId, status } = req.body;

    if (!websiteId || !Types.ObjectId.isValid(String(websiteId))) {
        throw new AppError("Valid websiteId is required.", 400);
    }
    if (!name || typeof name !== "string" || !name.trim()) {
        throw new AppError(BlogMessages.AUTHOR_NAME_REQUIRED, 400);
    }
    if (!slug || typeof slug !== "string" || !slug.trim()) {
        throw new AppError(BlogMessages.AUTHOR_SLUG_REQUIRED, 400);
    }
    if (userId && !Types.ObjectId.isValid(String(userId))) {
        throw new AppError("Invalid userId format.", 400);
    }
    if (status && !Object.values(BlogAuthorStatus).includes(status)) {
        throw new AppError("Invalid author status.", 400);
    }

    next();
};

export const updateAuthorValidation = (req: Request, _res: Response, next: NextFunction) => {
    const { name, slug, userId, status } = req.body;

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        throw new AppError(BlogMessages.AUTHOR_NAME_REQUIRED, 400);
    }
    if (slug !== undefined && (typeof slug !== "string" || !slug.trim())) {
        throw new AppError(BlogMessages.AUTHOR_SLUG_REQUIRED, 400);
    }
    if (userId && !Types.ObjectId.isValid(String(userId))) {
        throw new AppError("Invalid userId format.", 400);
    }
    if (status && !Object.values(BlogAuthorStatus).includes(status)) {
        throw new AppError("Invalid author status.", 400);
    }

    next();
};


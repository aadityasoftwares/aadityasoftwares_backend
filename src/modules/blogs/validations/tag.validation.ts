import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../utils/errors/app.error.js";
import { BlogMessages } from "../constants/blog.messages.js";
import { BlogTagStatus } from "../constants/blog.enums.js";
import { Types } from "mongoose";

export const createTagValidation = (req: Request, _res: Response, next: NextFunction) => {
    const { websiteId, name, slug, status } = req.body;

    if (!websiteId || !Types.ObjectId.isValid(String(websiteId))) {
        throw new AppError("Valid websiteId is required.", 400);
    }
    if (!name || typeof name !== "string" || !name.trim()) {
        throw new AppError(BlogMessages.TAG_NAME_REQUIRED, 400);
    }
    if (!slug || typeof slug !== "string" || !slug.trim()) {
        throw new AppError(BlogMessages.TAG_SLUG_REQUIRED, 400);
    }
    if (status && !Object.values(BlogTagStatus).includes(status)) {
        throw new AppError("Invalid tag status.", 400);
    }

    next();
};

export const updateTagValidation = (req: Request, _res: Response, next: NextFunction) => {
    const { name, slug, status } = req.body;

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        throw new AppError(BlogMessages.TAG_NAME_REQUIRED, 400);
    }
    if (slug !== undefined && (typeof slug !== "string" || !slug.trim())) {
        throw new AppError(BlogMessages.TAG_SLUG_REQUIRED, 400);
    }
    if (status && !Object.values(BlogTagStatus).includes(status)) {
        throw new AppError("Invalid tag status.", 400);
    }

    next();
};


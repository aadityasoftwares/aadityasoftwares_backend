import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../utils/errors/app.error.js";
import { BlogMessages } from "../constants/blog.messages.js";
import { BlogRedirectStatus, BlogRedirectType } from "../constants/blog.enums.js";
import { Types } from "mongoose";

export const createRedirectValidation = (req: Request, _res: Response, next: NextFunction) => {
    const { websiteId, sourcePath, destinationPath, redirectType, status } = req.body;

    if (!websiteId || !Types.ObjectId.isValid(String(websiteId))) {
        throw new AppError("Valid websiteId is required.", 400);
    }
    if (!sourcePath || typeof sourcePath !== "string" || !sourcePath.trim()) {
        throw new AppError(BlogMessages.REDIRECT_SOURCE_REQUIRED, 400);
    }
    if (!destinationPath || typeof destinationPath !== "string" || !destinationPath.trim()) {
        throw new AppError(BlogMessages.REDIRECT_DESTINATION_REQUIRED, 400);
    }
    if (redirectType && ![BlogRedirectType.PERMANENT, BlogRedirectType.TEMPORARY].includes(Number(redirectType))) {
        throw new AppError("Invalid redirect type. Allowed: 301, 302.", 400);
    }
    if (status && !Object.values(BlogRedirectStatus).includes(status)) {
        throw new AppError("Invalid redirect status.", 400);
    }

    next();
};

export const updateRedirectValidation = (req: Request, _res: Response, next: NextFunction) => {
    const { sourcePath, destinationPath, redirectType, status } = req.body;

    if (sourcePath !== undefined && (typeof sourcePath !== "string" || !sourcePath.trim())) {
        throw new AppError(BlogMessages.REDIRECT_SOURCE_REQUIRED, 400);
    }
    if (destinationPath !== undefined && (typeof destinationPath !== "string" || !destinationPath.trim())) {
        throw new AppError(BlogMessages.REDIRECT_DESTINATION_REQUIRED, 400);
    }
    if (redirectType && ![BlogRedirectType.PERMANENT, BlogRedirectType.TEMPORARY].includes(Number(redirectType))) {
        throw new AppError("Invalid redirect type. Allowed: 301, 302.", 400);
    }
    if (status && !Object.values(BlogRedirectStatus).includes(status)) {
        throw new AppError("Invalid redirect status.", 400);
    }

    next();
};


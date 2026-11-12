import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../utils/errors/app.error.js";
import { BlogMessages } from "../constants/blog.messages.js";
import { BlogWebsiteStatus } from "../constants/blog.enums.js";

export const createWebsiteValidation = (req: Request, _res: Response, next: NextFunction) => {
    const { name, slug, domain, baseUrl, status } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
        throw new AppError(BlogMessages.WEBSITE_NAME_REQUIRED, 400);
    }
    if (!slug || typeof slug !== "string" || !slug.trim()) {
        throw new AppError(BlogMessages.WEBSITE_SLUG_REQUIRED, 400);
    }
    if (!domain || typeof domain !== "string" || !domain.trim()) {
        throw new AppError(BlogMessages.WEBSITE_DOMAIN_REQUIRED, 400);
    }
    if (!baseUrl || typeof baseUrl !== "string" || !baseUrl.trim()) {
        throw new AppError(BlogMessages.WEBSITE_BASE_URL_REQUIRED, 400);
    }
    if (status && !Object.values(BlogWebsiteStatus).includes(status)) {
        throw new AppError("Invalid website status.", 400);
    }

    next();
};

export const updateWebsiteValidation = (req: Request, _res: Response, next: NextFunction) => {
    const { name, slug, domain, baseUrl, status } = req.body;

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        throw new AppError(BlogMessages.WEBSITE_NAME_REQUIRED, 400);
    }
    if (slug !== undefined && (typeof slug !== "string" || !slug.trim())) {
        throw new AppError(BlogMessages.WEBSITE_SLUG_REQUIRED, 400);
    }
    if (domain !== undefined && (typeof domain !== "string" || !domain.trim())) {
        throw new AppError(BlogMessages.WEBSITE_DOMAIN_REQUIRED, 400);
    }
    if (baseUrl !== undefined && (typeof baseUrl !== "string" || !baseUrl.trim())) {
        throw new AppError(BlogMessages.WEBSITE_BASE_URL_REQUIRED, 400);
    }
    if (status && !Object.values(BlogWebsiteStatus).includes(status)) {
        throw new AppError("Invalid website status.", 400);
    }

    next();
};


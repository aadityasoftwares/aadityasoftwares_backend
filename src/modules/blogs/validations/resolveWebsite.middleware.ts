import type { Request, Response, NextFunction } from "express";
import { BlogWebsiteRepository } from "../repositories/blogWebsite.repository.js";
import { AppError } from "../../../utils/errors/app.error.js";
import { BlogMessages } from "../constants/blog.messages.js";
import { BlogWebsiteStatus } from "../constants/blog.enums.js";
import type { IBlogWebsiteDocument } from "../interfaces/blog.interface.js";

declare global {
    namespace Express {
        interface Request {
            blogWebsite?: IBlogWebsiteDocument;
        }
    }
}

export const resolveWebsite = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const repo = new BlogWebsiteRepository();
        let website: any = null;

        // 1. Check header x-website-slug or x-website-id
        const headerSlug = req.headers["x-website-slug"] as string | undefined;
        const headerId = req.headers["x-website-id"] as string | undefined;
        const querySlug = (req.query.websiteSlug || req.query.website) as string | undefined;
        const queryId = req.query.websiteId as string | undefined;

        if (headerSlug) {
            website = await repo.findBySlug(headerSlug);
        } else if (headerId) {
            website = await repo.findById(headerId);
        } else if (querySlug) {
            website = await repo.findBySlug(querySlug);
        } else if (queryId) {
            website = await repo.findById(queryId);
        }

        // 2. Fallback to Host / Hostname
        if (!website) {
            const hostHeader = (req.headers.host || req.hostname || "").split(":")[0].toLowerCase();
            if (hostHeader && hostHeader !== "localhost" && hostHeader !== "127.0.0.1") {
                website = await repo.findByDomain(hostHeader);
            }
        }

        // 3. Dev fallback: If running on localhost and only 1 active website exists or default to first
        if (!website && (req.hostname === "localhost" || req.hostname === "127.0.0.1")) {
            const allWebsites = await repo.findAll({ limit: 1 });
            if (allWebsites.data.length > 0) {
                website = allWebsites.data[0];
            }
        }

        if (!website) {
            throw new AppError(BlogMessages.UNRESOLVED_WEBSITE, 404);
        }

        if (website.status !== BlogWebsiteStatus.ACTIVE) {
            throw new AppError(BlogMessages.WEBSITE_INACTIVE, 403);
        }

        req.blogWebsite = website;
        res.locals.blogWebsite = website;
        res.locals.blogWebsiteId = String(website._id);

        next();
    } catch (error) {
        next(error);
    }
};


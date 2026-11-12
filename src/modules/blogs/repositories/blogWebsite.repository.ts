import { Types } from "mongoose";
import { BlogWebsiteModel } from "../models/blogWebsite.model.js";
import type { IBlogWebsite, IBlogWebsiteFilter } from "../interfaces/blog.interface.js";

export class BlogWebsiteRepository {
    async create(data: Partial<IBlogWebsite>) {
        return BlogWebsiteModel.create(data);
    }

    async findById(id: string) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogWebsiteModel.findById(id)
            .populate("logoMediaId", "storageKey publicUrl originalFileName mimeType size")
            .populate("faviconMediaId", "storageKey publicUrl originalFileName mimeType size")
            .populate("defaultAuthorId", "name slug designation profileImageMediaId")
            .lean()
            .exec();
    }

    async findBySlug(slug: string) {
        if (!slug) return null;
        return BlogWebsiteModel.findOne({ slug: slug.toLowerCase().trim() })
            .populate("logoMediaId", "storageKey publicUrl originalFileName mimeType size")
            .populate("faviconMediaId", "storageKey publicUrl originalFileName mimeType size")
            .populate("defaultAuthorId", "name slug designation profileImageMediaId")
            .lean()
            .exec();
    }

    async findByDomain(domain: string) {
        if (!domain) return null;
        const normalized = domain.toLowerCase().trim();
        return BlogWebsiteModel.findOne({
            $or: [{ domain: normalized }, { domain: normalized.replace(/^www\./, "") }],
        })
            .populate("logoMediaId", "storageKey publicUrl originalFileName mimeType size")
            .populate("faviconMediaId", "storageKey publicUrl originalFileName mimeType size")
            .populate("defaultAuthorId", "name slug designation profileImageMediaId")
            .lean()
            .exec();
    }

    async update(id: string, data: Partial<IBlogWebsite>) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogWebsiteModel.findByIdAndUpdate(
            id,
            { $set: data },
            { returnDocument: "after", runValidators: true },
        )
            .lean()
            .exec();
    }

    async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
        const query: Record<string, unknown> = { slug: slug.toLowerCase().trim() };
        if (excludeId && Types.ObjectId.isValid(excludeId)) {
            query._id = { $ne: new Types.ObjectId(excludeId) };
        }
        const exists = await BlogWebsiteModel.exists(query);
        return !!exists;
    }

    async existsByDomain(domain: string, excludeId?: string): Promise<boolean> {
        const query: Record<string, unknown> = { domain: domain.toLowerCase().trim() };
        if (excludeId && Types.ObjectId.isValid(excludeId)) {
            query._id = { $ne: new Types.ObjectId(excludeId) };
        }
        const exists = await BlogWebsiteModel.exists(query);
        return !!exists;
    }

    async findAll(filter: IBlogWebsiteFilter = {}) {
        const { page = 1, limit = 10, search, status, sortBy = "createdAt", sortOrder = "desc" } = filter;
        const query: Record<string, any> = {};

        if (status) query.status = status;
        if (search) {
            const regex = { $regex: search.trim(), $options: "i" };
            query.$or = [{ name: regex }, { slug: regex }, { domain: regex }];
        }

        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 100);
        const skip = (safePage - 1) * safeLimit;

        const [data, total] = await Promise.all([
            BlogWebsiteModel.find(query)
                .populate("logoMediaId", "storageKey publicUrl originalFileName")
                .populate("faviconMediaId", "storageKey publicUrl originalFileName")
                .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
                .skip(skip)
                .limit(safeLimit)
                .lean()
                .exec(),
            BlogWebsiteModel.countDocuments(query),
        ]);

        return {
            data,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages: Math.ceil(total / safeLimit),
            },
        };
    }
}


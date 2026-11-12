import { Types } from "mongoose";
import { BlogRedirectModel } from "../models/blogRedirect.model.js";
import { BlogRedirectStatus } from "../constants/blog.enums.js";
import type { IBlogRedirect, IBlogRedirectFilter } from "../interfaces/blog.interface.js";

export class BlogRedirectRepository {
    async create(data: Partial<IBlogRedirect>) {
        return BlogRedirectModel.create(data);
    }

    async findById(id: string) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogRedirectModel.findById(id).lean().exec();
    }

    async findBySource(websiteId: string, sourcePath: string) {
        if (!Types.ObjectId.isValid(websiteId) || !sourcePath) return null;
        return BlogRedirectModel.findOne({
            websiteId: new Types.ObjectId(websiteId),
            sourcePath: sourcePath.trim(),
            status: BlogRedirectStatus.ACTIVE,
        })
            .lean()
            .exec();
    }

    async update(id: string, data: Partial<IBlogRedirect>) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogRedirectModel.findByIdAndUpdate(
            id,
            { $set: data },
            { returnDocument: "after", runValidators: true },
        )
            .lean()
            .exec();
    }

    async delete(id: string) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogRedirectModel.findByIdAndDelete(id).lean().exec();
    }

    async existsBySource(websiteId: string, sourcePath: string, excludeId?: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(websiteId) || !sourcePath) return false;
        const query: Record<string, unknown> = {
            websiteId: new Types.ObjectId(websiteId),
            sourcePath: sourcePath.trim(),
        };
        if (excludeId && Types.ObjectId.isValid(excludeId)) {
            query._id = { $ne: new Types.ObjectId(excludeId) };
        }
        const exists = await BlogRedirectModel.exists(query);
        return !!exists;
    }

    async findAll(filter: IBlogRedirectFilter = {}) {
        const { websiteId, search, status, page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = filter;
        const query: Record<string, any> = {};

        if (websiteId && Types.ObjectId.isValid(websiteId)) {
            query.websiteId = new Types.ObjectId(websiteId);
        }
        if (status) query.status = status;
        if (search) {
            const regex = { $regex: search.trim(), $options: "i" };
            query.$or = [{ sourcePath: regex }, { destinationPath: regex }];
        }

        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
        const skip = (safePage - 1) * safeLimit;

        const [data, total] = await Promise.all([
            BlogRedirectModel.find(query)
                .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
                .skip(skip)
                .limit(safeLimit)
                .lean()
                .exec(),
            BlogRedirectModel.countDocuments(query),
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


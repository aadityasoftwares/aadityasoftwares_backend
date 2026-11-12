import { Types } from "mongoose";
import { BlogTagModel } from "../models/blogTag.model.js";
import type { IBlogTag, IBlogTagFilter } from "../interfaces/blog.interface.js";

export class BlogTagRepository {
    async create(data: Partial<IBlogTag>) {
        return BlogTagModel.create(data);
    }

    async findById(id: string) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogTagModel.findById(id).lean().exec();
    }

    async findBySlug(websiteId: string, slug: string) {
        if (!Types.ObjectId.isValid(websiteId) || !slug) return null;
        return BlogTagModel.findOne({
            websiteId: new Types.ObjectId(websiteId),
            slug: slug.toLowerCase().trim(),
        })
            .lean()
            .exec();
    }

    async update(id: string, data: Partial<IBlogTag>) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogTagModel.findByIdAndUpdate(
            id,
            { $set: data },
            { returnDocument: "after", runValidators: true },
        )
            .lean()
            .exec();
    }

    async delete(id: string) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogTagModel.findByIdAndDelete(id).lean().exec();
    }

    async existsBySlug(websiteId: string, slug: string, excludeId?: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(websiteId) || !slug) return false;
        const query: Record<string, unknown> = {
            websiteId: new Types.ObjectId(websiteId),
            slug: slug.toLowerCase().trim(),
        };
        if (excludeId && Types.ObjectId.isValid(excludeId)) {
            query._id = { $ne: new Types.ObjectId(excludeId) };
        }
        const exists = await BlogTagModel.exists(query);
        return !!exists;
    }

    async findAll(filter: IBlogTagFilter = {}) {
        const { websiteId, search, status, page = 1, limit = 50, sortBy = "name", sortOrder = "asc" } = filter;
        const query: Record<string, any> = {};

        if (websiteId && Types.ObjectId.isValid(websiteId)) {
            query.websiteId = new Types.ObjectId(websiteId);
        }
        if (status) query.status = status;
        if (search) {
            const regex = { $regex: search.trim(), $options: "i" };
            query.$or = [{ name: regex }, { slug: regex }];
        }

        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 100);
        const skip = (safePage - 1) * safeLimit;

        const [data, total] = await Promise.all([
            BlogTagModel.find(query)
                .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
                .skip(skip)
                .limit(safeLimit)
                .lean()
                .exec(),
            BlogTagModel.countDocuments(query),
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


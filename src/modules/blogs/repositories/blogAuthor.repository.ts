import { Types } from "mongoose";
import { BlogAuthorModel } from "../models/blogAuthor.model.js";
import type { IBlogAuthor, IBlogAuthorFilter } from "../interfaces/blog.interface.js";

export class BlogAuthorRepository {
    async create(data: Partial<IBlogAuthor>) {
        return BlogAuthorModel.create(data);
    }

    async findById(id: string) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogAuthorModel.findById(id)
            .populate("profileImageMediaId", "storageKey publicUrl originalFileName")
            .lean()
            .exec();
    }

    async findBySlug(websiteId: string, slug: string) {
        if (!Types.ObjectId.isValid(websiteId) || !slug) return null;
        return BlogAuthorModel.findOne({
            websiteId: new Types.ObjectId(websiteId),
            slug: slug.toLowerCase().trim(),
        })
            .populate("profileImageMediaId", "storageKey publicUrl originalFileName")
            .lean()
            .exec();
    }

    async findByUserId(websiteId: string, userId: string) {
        if (!Types.ObjectId.isValid(websiteId) || !Types.ObjectId.isValid(userId)) return null;
        return BlogAuthorModel.findOne({
            websiteId: new Types.ObjectId(websiteId),
            userId: new Types.ObjectId(userId),
        })
            .populate("profileImageMediaId", "storageKey publicUrl originalFileName")
            .lean()
            .exec();
    }

    async update(id: string, data: Partial<IBlogAuthor>) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogAuthorModel.findByIdAndUpdate(
            id,
            { $set: data },
            { returnDocument: "after", runValidators: true },
        )
            .populate("profileImageMediaId", "storageKey publicUrl originalFileName")
            .lean()
            .exec();
    }

    async delete(id: string) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogAuthorModel.findByIdAndDelete(id).lean().exec();
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
        const exists = await BlogAuthorModel.exists(query);
        return !!exists;
    }

    async findAll(filter: IBlogAuthorFilter = {}) {
        const { websiteId, search, status, page = 1, limit = 20, sortBy = "name", sortOrder = "asc" } = filter;
        const query: Record<string, any> = {};

        if (websiteId && Types.ObjectId.isValid(websiteId)) {
            query.websiteId = new Types.ObjectId(websiteId);
        }
        if (status) query.status = status;
        if (search) {
            const regex = { $regex: search.trim(), $options: "i" };
            query.$or = [{ name: regex }, { slug: regex }, { designation: regex }];
        }

        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
        const skip = (safePage - 1) * safeLimit;

        const [data, total] = await Promise.all([
            BlogAuthorModel.find(query)
                .populate("profileImageMediaId", "storageKey publicUrl originalFileName")
                .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
                .skip(skip)
                .limit(safeLimit)
                .lean()
                .exec(),
            BlogAuthorModel.countDocuments(query),
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


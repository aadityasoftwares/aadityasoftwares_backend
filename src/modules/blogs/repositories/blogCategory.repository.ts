import { Types } from "mongoose";
import { BlogCategoryModel } from "../models/blogCategory.model.js";
import type { IBlogCategory, IBlogCategoryFilter } from "../interfaces/blog.interface.js";

export class BlogCategoryRepository {
    async create(data: Partial<IBlogCategory>) {
        return BlogCategoryModel.create(data);
    }

    async findById(id: string) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogCategoryModel.findById(id)
            .populate("parentCategoryId", "name slug")
            .populate("featuredImageMediaId", "storageKey publicUrl originalFileName")
            .lean()
            .exec();
    }

    async findBySlug(websiteId: string, slug: string) {
        if (!Types.ObjectId.isValid(websiteId) || !slug) return null;
        return BlogCategoryModel.findOne({
            websiteId: new Types.ObjectId(websiteId),
            slug: slug.toLowerCase().trim(),
        })
            .populate("parentCategoryId", "name slug")
            .populate("featuredImageMediaId", "storageKey publicUrl originalFileName")
            .lean()
            .exec();
    }

    async update(id: string, data: Partial<IBlogCategory>) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogCategoryModel.findByIdAndUpdate(
            id,
            { $set: data },
            { returnDocument: "after", runValidators: true },
        )
            .populate("parentCategoryId", "name slug")
            .populate("featuredImageMediaId", "storageKey publicUrl originalFileName")
            .lean()
            .exec();
    }

    async delete(id: string) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogCategoryModel.findByIdAndDelete(id).lean().exec();
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
        const exists = await BlogCategoryModel.exists(query);
        return !!exists;
    }

    async findDescendantIds(categoryId: string): Promise<string[]> {
        if (!Types.ObjectId.isValid(categoryId)) return [];
        const descendants: string[] = [];
        const queue: string[] = [categoryId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            const children = await BlogCategoryModel.find({
                parentCategoryId: new Types.ObjectId(currentId),
            })
                .select("_id")
                .lean()
                .exec();

            for (const child of children) {
                const childId = child._id.toString();
                descendants.push(childId);
                queue.push(childId);
            }
        }

        return descendants;
    }

    async findAll(filter: IBlogCategoryFilter = {}) {
        const {
            websiteId,
            search,
            parentCategoryId,
            status,
            page = 1,
            limit = 20,
            sortBy = "name",
            sortOrder = "asc",
        } = filter;

        const query: Record<string, any> = {};

        if (websiteId && Types.ObjectId.isValid(websiteId)) {
            query.websiteId = new Types.ObjectId(websiteId);
        }
        if (status) query.status = status;
        if (parentCategoryId !== undefined) {
            query.parentCategoryId =
                parentCategoryId && Types.ObjectId.isValid(parentCategoryId)
                    ? new Types.ObjectId(parentCategoryId)
                    : null;
        }
        if (search) {
            const regex = { $regex: search.trim(), $options: "i" };
            query.$or = [{ name: regex }, { slug: regex }, { description: regex }];
        }

        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
        const skip = (safePage - 1) * safeLimit;

        const [data, total] = await Promise.all([
            BlogCategoryModel.find(query)
                .populate("parentCategoryId", "name slug")
                .populate("featuredImageMediaId", "storageKey publicUrl originalFileName")
                .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
                .skip(skip)
                .limit(safeLimit)
                .lean()
                .exec(),
            BlogCategoryModel.countDocuments(query),
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


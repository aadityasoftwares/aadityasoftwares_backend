import { Types } from "mongoose";
import { BlogModel } from "../models/blog.model.js";
import { BlogStatus } from "../constants/blog.enums.js";
import type { IBlog, IBlogFilter } from "../interfaces/blog.interface.js";

export class BlogRepository {
    async create(data: Partial<IBlog>) {
        return BlogModel.create(data);
    }

    async findById(id: string) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogModel.findById(id)
            .populate("featuredImageMediaId", "storageKey publicUrl originalFileName mimeType size")
            .populate("categoryIds", "name slug")
            .populate("tagIds", "name slug")
            .populate("authorId", "name slug designation profileImageMediaId")
            .populate("coAuthorIds", "name slug designation profileImageMediaId")
            .populate("seo.ogImageMediaId", "storageKey publicUrl originalFileName")
            .populate("seo.twitterImageMediaId", "storageKey publicUrl originalFileName")
            .lean()
            .exec();
    }

    async findBySlug(websiteId: string, slug: string) {
        if (!Types.ObjectId.isValid(websiteId) || !slug) return null;
        return BlogModel.findOne({
            websiteId: new Types.ObjectId(websiteId),
            slug: slug.toLowerCase().trim(),
        })
            .populate("featuredImageMediaId", "storageKey publicUrl originalFileName mimeType size")
            .populate("categoryIds", "name slug")
            .populate("tagIds", "name slug")
            .populate("authorId", "name slug designation profileImageMediaId socialLinks biography")
            .populate("coAuthorIds", "name slug designation profileImageMediaId")
            .populate("seo.ogImageMediaId", "storageKey publicUrl originalFileName")
            .populate("seo.twitterImageMediaId", "storageKey publicUrl originalFileName")
            .lean()
            .exec();
    }

    async findPublicBySlug(websiteId: string, slug: string) {
        if (!Types.ObjectId.isValid(websiteId) || !slug) return null;
        const now = new Date();
        return BlogModel.findOne({
            websiteId: new Types.ObjectId(websiteId),
            slug: slug.toLowerCase().trim(),
            status: BlogStatus.PUBLISHED,
            publishedAt: { $lte: now },
        })
            .populate("featuredImageMediaId", "storageKey publicUrl originalFileName mimeType size")
            .populate("categoryIds", "name slug")
            .populate("tagIds", "name slug")
            .populate("authorId", "name slug designation profileImageMediaId socialLinks biography")
            .populate("coAuthorIds", "name slug designation profileImageMediaId")
            .populate("seo.ogImageMediaId", "storageKey publicUrl originalFileName")
            .populate("seo.twitterImageMediaId", "storageKey publicUrl originalFileName")
            .lean()
            .exec();
    }

    async update(id: string, data: Partial<IBlog>) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogModel.findByIdAndUpdate(
            id,
            { $set: data },
            { returnDocument: "after", runValidators: true },
        )
            .populate("featuredImageMediaId", "storageKey publicUrl originalFileName mimeType size")
            .populate("categoryIds", "name slug")
            .populate("tagIds", "name slug")
            .populate("authorId", "name slug designation profileImageMediaId")
            .lean()
            .exec();
    }

    async delete(id: string) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogModel.findByIdAndDelete(id).lean().exec();
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
        const exists = await BlogModel.exists(query);
        return !!exists;
    }

    async countByCategoryId(categoryId: string, status?: BlogStatus): Promise<number> {
        if (!Types.ObjectId.isValid(categoryId)) return 0;
        const query: Record<string, any> = { categoryIds: new Types.ObjectId(categoryId) };
        if (status) query.status = status;
        return BlogModel.countDocuments(query);
    }

    async countByTagId(tagId: string, status?: BlogStatus): Promise<number> {
        if (!Types.ObjectId.isValid(tagId)) return 0;
        const query: Record<string, any> = { tagIds: new Types.ObjectId(tagId) };
        if (status) query.status = status;
        return BlogModel.countDocuments(query);
    }

    async countByAuthorId(authorId: string, status?: BlogStatus): Promise<number> {
        if (!Types.ObjectId.isValid(authorId)) return 0;
        const query: Record<string, any> = { authorId: new Types.ObjectId(authorId) };
        if (status) query.status = status;
        return BlogModel.countDocuments(query);
    }

    async findScheduledReadyToPublish(now = new Date()): Promise<IBlog[]> {
        return BlogModel.find({
            status: BlogStatus.SCHEDULED,
            scheduledAt: { $lte: now },
        })
            .lean()
            .exec() as any;
    }

    async findRelated(
        websiteId: string,
        blogId: string,
        categoryIds: (Types.ObjectId | string)[],
        tagIds: (Types.ObjectId | string)[],
        limit = 4,
    ) {
        if (!Types.ObjectId.isValid(websiteId)) return [];
        const now = new Date();
        const validCategoryIds = categoryIds
            .filter((id) => Types.ObjectId.isValid(String(id)))
            .map((id) => new Types.ObjectId(String(id)));
        const validTagIds = tagIds
            .filter((id) => Types.ObjectId.isValid(String(id)))
            .map((id) => new Types.ObjectId(String(id)));

        const orConditions: any[] = [];
        if (validCategoryIds.length > 0) {
            orConditions.push({ categoryIds: { $in: validCategoryIds } });
        }
        if (validTagIds.length > 0) {
            orConditions.push({ tagIds: { $in: validTagIds } });
        }

        if (orConditions.length === 0) return [];

        return BlogModel.find({
            websiteId: new Types.ObjectId(websiteId),
            _id: { $ne: new Types.ObjectId(blogId) },
            status: BlogStatus.PUBLISHED,
            publishedAt: { $lte: now },
            $or: orConditions,
        })
            .select(
                "title slug excerpt featuredImageMediaId featuredImageAlt categoryIds authorId publishedAt readingTime",
            )
            .populate("featuredImageMediaId", "storageKey publicUrl originalFileName")
            .populate("categoryIds", "name slug")
            .populate("authorId", "name slug designation profileImageMediaId")
            .limit(limit)
            .sort({ publishedAt: -1 })
            .lean()
            .exec();
    }

    async findForSitemap(websiteId: string) {
        if (!Types.ObjectId.isValid(websiteId)) return [];
        const now = new Date();
        return BlogModel.find({
            websiteId: new Types.ObjectId(websiteId),
            status: BlogStatus.PUBLISHED,
            publishedAt: { $lte: now },
            allowIndexing: true,
            "seo.robots": { $not: /noindex/i },
        })
            .select("slug publishedAt updatedAt")
            .sort({ publishedAt: -1 })
            .lean()
            .exec();
    }

    async findAll(filter: IBlogFilter = {}, isPublic = false) {
        const {
            websiteId,
            search,
            categoryId,
            tagId,
            authorId,
            status,
            isFeatured,
            page = 1,
            limit = 10,
            sortBy = isPublic ? "publishedAt" : "createdAt",
            sortOrder = "desc",
        } = filter;

        const query: Record<string, any> = {};

        if (websiteId && Types.ObjectId.isValid(websiteId)) {
            query.websiteId = new Types.ObjectId(websiteId);
        }

        if (isPublic) {
            // Strict public safety: only PUBLISHED articles with past/current publication timestamp
            query.status = BlogStatus.PUBLISHED;
            query.publishedAt = { $lte: new Date() };
        } else if (status) {
            query.status = status;
        }

        if (isFeatured !== undefined) {
            query.isFeatured = isFeatured;
        }

        if (categoryId && Types.ObjectId.isValid(categoryId)) {
            query.categoryIds = new Types.ObjectId(categoryId);
        }

        if (tagId && Types.ObjectId.isValid(tagId)) {
            query.tagIds = new Types.ObjectId(tagId);
        }

        if (authorId && Types.ObjectId.isValid(authorId)) {
            query.authorId = new Types.ObjectId(authorId);
        }

        if (search) {
            const regex = { $regex: search.trim(), $options: "i" };
            query.$or = [{ title: regex }, { excerpt: regex }, { slug: regex }];
        }

        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 100);
        const skip = (safePage - 1) * safeLimit;

        // When listing, exclude heavy `content` field for speed and bandwidth optimization
        const projection = isPublic
            ? "title slug excerpt featuredImageMediaId featuredImageAlt categoryIds tagIds authorId publishedAt readingTime wordCount isFeatured seo"
            : "-content";

        const [data, total] = await Promise.all([
            BlogModel.find(query)
                .select(projection)
                .populate("featuredImageMediaId", "storageKey publicUrl originalFileName")
                .populate("categoryIds", "name slug")
                .populate("tagIds", "name slug")
                .populate("authorId", "name slug designation profileImageMediaId")
                .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
                .skip(skip)
                .limit(safeLimit)
                .lean()
                .exec(),
            BlogModel.countDocuments(query),
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


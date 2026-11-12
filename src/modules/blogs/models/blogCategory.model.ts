import mongoose, { Schema } from "mongoose";
import type { IBlogCategoryDocument } from "../interfaces/blog.interface.js";
import { BlogCategoryStatus } from "../constants/blog.enums.js";

const BlogCategorySchema = new Schema<IBlogCategoryDocument>(
    {
        websiteId: {
            type: Schema.Types.ObjectId,
            ref: "BlogWebsite",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 120,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        parentCategoryId: {
            type: Schema.Types.ObjectId,
            ref: "BlogCategory",
            default: null,
            index: true,
        },
        featuredImageMediaId: {
            type: Schema.Types.ObjectId,
            ref: "Media",
            default: null,
        },
        seo: {
            title: { type: String, trim: true, default: "" },
            description: { type: String, trim: true, default: "" },
            canonicalUrl: { type: String, trim: true, default: "" },
            robots: { type: String, trim: true, default: "index, follow" },
            ogTitle: { type: String, trim: true, default: "" },
            ogDescription: { type: String, trim: true, default: "" },
            ogImageMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
        },
        status: {
            type: String,
            enum: Object.values(BlogCategoryStatus),
            default: BlogCategoryStatus.ACTIVE,
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
        collection: "blog_categories",
    },
);

BlogCategorySchema.index({ websiteId: 1, slug: 1 }, { unique: true });
BlogCategorySchema.index({ websiteId: 1, parentCategoryId: 1 });
BlogCategorySchema.index({ websiteId: 1, status: 1 });

export const BlogCategoryModel =
    mongoose.models.BlogCategory ||
    mongoose.model<IBlogCategoryDocument>("BlogCategory", BlogCategorySchema);


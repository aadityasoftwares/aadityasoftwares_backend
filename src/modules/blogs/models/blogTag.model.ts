import mongoose, { Schema } from "mongoose";
import type { IBlogTagDocument } from "../interfaces/blog.interface.js";
import { BlogTagStatus } from "../constants/blog.enums.js";

const BlogTagSchema = new Schema<IBlogTagDocument>(
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
            maxlength: 80,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 80,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        seo: {
            title: { type: String, trim: true, default: "" },
            description: { type: String, trim: true, default: "" },
            canonicalUrl: { type: String, trim: true, default: "" },
            robots: { type: String, trim: true, default: "index, follow" },
        },
        status: {
            type: String,
            enum: Object.values(BlogTagStatus),
            default: BlogTagStatus.ACTIVE,
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
        collection: "blog_tags",
    },
);

BlogTagSchema.index({ websiteId: 1, slug: 1 }, { unique: true });
BlogTagSchema.index({ websiteId: 1, status: 1 });

export const BlogTagModel =
    mongoose.models.BlogTag ||
    mongoose.model<IBlogTagDocument>("BlogTag", BlogTagSchema);


import mongoose, { Schema } from "mongoose";
import type { IBlogRevisionDocument } from "../interfaces/blog.interface.js";

const BlogRevisionSchema = new Schema<IBlogRevisionDocument>(
    {
        websiteId: {
            type: Schema.Types.ObjectId,
            ref: "BlogWebsite",
            required: true,
            index: true,
        },
        blogId: {
            type: Schema.Types.ObjectId,
            ref: "Blog",
            required: true,
            index: true,
        },
        version: {
            type: Number,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
        },
        excerpt: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: Schema.Types.Mixed,
            required: true,
        },
        seo: {
            type: Schema.Types.Mixed,
            default: {},
        },
        changeSummary: {
            type: String,
            trim: true,
            default: "",
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
        collection: "blog_revisions",
    },
);

BlogRevisionSchema.index({ blogId: 1, version: -1 });
BlogRevisionSchema.index({ websiteId: 1, blogId: 1 });

export const BlogRevisionModel =
    mongoose.models.BlogRevision ||
    mongoose.model<IBlogRevisionDocument>("BlogRevision", BlogRevisionSchema);


import mongoose, { Schema } from "mongoose";
import type { IBlogRedirectDocument } from "../interfaces/blog.interface.js";
import { BlogRedirectStatus, BlogRedirectType } from "../constants/blog.enums.js";

const BlogRedirectSchema = new Schema<IBlogRedirectDocument>(
    {
        websiteId: {
            type: Schema.Types.ObjectId,
            ref: "BlogWebsite",
            required: true,
            index: true,
        },
        sourcePath: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255,
        },
        destinationPath: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255,
        },
        redirectType: {
            type: Number,
            enum: [BlogRedirectType.PERMANENT, BlogRedirectType.TEMPORARY],
            default: BlogRedirectType.PERMANENT,
        },
        status: {
            type: String,
            enum: Object.values(BlogRedirectStatus),
            default: BlogRedirectStatus.ACTIVE,
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
        collection: "blog_redirects",
    },
);

BlogRedirectSchema.index({ websiteId: 1, sourcePath: 1 }, { unique: true });
BlogRedirectSchema.index({ websiteId: 1, status: 1 });

export const BlogRedirectModel =
    mongoose.models.BlogRedirect ||
    mongoose.model<IBlogRedirectDocument>("BlogRedirect", BlogRedirectSchema);


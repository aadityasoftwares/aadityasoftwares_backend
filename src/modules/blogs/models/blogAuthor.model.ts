import mongoose, { Schema } from "mongoose";
import type { IBlogAuthorDocument } from "../interfaces/blog.interface.js";
import { BlogAuthorStatus } from "../constants/blog.enums.js";

const BlogAuthorSchema = new Schema<IBlogAuthorDocument>(
    {
        websiteId: {
            type: Schema.Types.ObjectId,
            ref: "BlogWebsite",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
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
        designation: {
            type: String,
            trim: true,
            default: "",
        },
        biography: {
            type: String,
            trim: true,
            default: "",
        },
        profileImageMediaId: {
            type: Schema.Types.ObjectId,
            ref: "Media",
            default: null,
        },
        socialLinks: {
            website: { type: String, trim: true, default: "" },
            twitter: { type: String, trim: true, default: "" },
            linkedin: { type: String, trim: true, default: "" },
            github: { type: String, trim: true, default: "" },
        },
        status: {
            type: String,
            enum: Object.values(BlogAuthorStatus),
            default: BlogAuthorStatus.ACTIVE,
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
        collection: "blog_authors",
    },
);

BlogAuthorSchema.index({ websiteId: 1, slug: 1 }, { unique: true });
BlogAuthorSchema.index({ websiteId: 1, status: 1 });

export const BlogAuthorModel =
    mongoose.models.BlogAuthor ||
    mongoose.model<IBlogAuthorDocument>("BlogAuthor", BlogAuthorSchema);


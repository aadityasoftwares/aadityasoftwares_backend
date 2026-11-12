import mongoose, { Schema } from "mongoose";
import type { IBlogDocument } from "../interfaces/blog.interface.js";
import { BlogContentFormat, BlogStatus } from "../constants/blog.enums.js";

const BlogSchema = new Schema<IBlogDocument>(
    {
        websiteId: {
            type: Schema.Types.ObjectId,
            ref: "BlogWebsite",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 250,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 250,
        },
        excerpt: {
            type: String,
            required: true,
            trim: true,
            maxlength: 600,
        },
        content: {
            type: Schema.Types.Mixed,
            required: true,
        },
        contentFormat: {
            type: String,
            enum: Object.values(BlogContentFormat),
            default: BlogContentFormat.JSON,
        },
        contentRawText: {
            type: String,
            default: "",
        },
        featuredImageMediaId: {
            type: Schema.Types.ObjectId,
            ref: "Media",
            default: null,
        },
        featuredImageAlt: {
            type: String,
            trim: true,
            default: "",
        },
        categoryIds: [
            {
                type: Schema.Types.ObjectId,
                ref: "BlogCategory",
            },
        ],
        tagIds: [
            {
                type: Schema.Types.ObjectId,
                ref: "BlogTag",
            },
        ],
        authorId: {
            type: Schema.Types.ObjectId,
            ref: "BlogAuthor",
            required: true,
            index: true,
        },
        coAuthorIds: [
            {
                type: Schema.Types.ObjectId,
                ref: "BlogAuthor",
            },
        ],
        status: {
            type: String,
            enum: Object.values(BlogStatus),
            default: BlogStatus.DRAFT,
            index: true,
        },
        publishedAt: {
            type: Date,
            default: null,
            index: true,
        },
        scheduledAt: {
            type: Date,
            default: null,
            index: true,
        },
        allowComments: {
            type: Boolean,
            default: false,
        },
        isFeatured: {
            type: Boolean,
            default: false,
            index: true,
        },
        allowIndexing: {
            type: Boolean,
            default: true,
        },
        readingTime: {
            type: Number,
            default: 1,
            min: 1,
        },
        wordCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        seo: {
            title: { type: String, trim: true, default: "" },
            description: { type: String, trim: true, default: "" },
            canonicalUrl: { type: String, trim: true, default: "" },
            focusKeyword: { type: String, trim: true, default: "" },
            robots: { type: String, trim: true, default: "index, follow" },
            ogTitle: { type: String, trim: true, default: "" },
            ogDescription: { type: String, trim: true, default: "" },
            ogImageMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
            twitterTitle: { type: String, trim: true, default: "" },
            twitterDescription: { type: String, trim: true, default: "" },
            twitterImageMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
            schemaType: { type: String, trim: true, default: "Article" },
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
        publishedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
        collection: "blogs",
    },
);

BlogSchema.index({ websiteId: 1, slug: 1 }, { unique: true });
BlogSchema.index({ websiteId: 1, status: 1, publishedAt: -1 });
BlogSchema.index({ websiteId: 1, categoryIds: 1 });
BlogSchema.index({ websiteId: 1, tagIds: 1 });
BlogSchema.index({ websiteId: 1, authorId: 1 });
BlogSchema.index({ websiteId: 1, isFeatured: 1 });
BlogSchema.index({ websiteId: 1, scheduledAt: 1 });

export const BlogModel =
    mongoose.models.Blog ||
    mongoose.model<IBlogDocument>("Blog", BlogSchema);


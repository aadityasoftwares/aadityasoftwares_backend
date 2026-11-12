import mongoose, { Schema } from "mongoose";
import type { IBlogWebsiteDocument } from "../interfaces/blog.interface.js";
import { BlogWebsiteStatus } from "../constants/blog.enums.js";

const BlogWebsiteSchema = new Schema<IBlogWebsiteDocument>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
            maxlength: 100,
        },
        domain: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
            maxlength: 255,
        },
        baseUrl: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        logoMediaId: {
            type: Schema.Types.ObjectId,
            ref: "Media",
            default: null,
        },
        faviconMediaId: {
            type: Schema.Types.ObjectId,
            ref: "Media",
            default: null,
        },
        defaultAuthorId: {
            type: Schema.Types.ObjectId,
            ref: "BlogAuthor",
            default: null,
        },
        defaultLanguage: {
            type: String,
            trim: true,
            default: "en",
        },
        defaultSeo: {
            title: { type: String, trim: true, default: "" },
            description: { type: String, trim: true, default: "" },
            canonicalUrl: { type: String, trim: true, default: "" },
            robots: { type: String, trim: true, default: "index, follow" },
            ogTitle: { type: String, trim: true, default: "" },
            ogDescription: { type: String, trim: true, default: "" },
            ogImageMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
            twitterTitle: { type: String, trim: true, default: "" },
            twitterDescription: { type: String, trim: true, default: "" },
            twitterImageMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
            schemaType: { type: String, trim: true, default: "Organization" },
        },
        socialLinks: {
            twitter: { type: String, trim: true, default: "" },
            facebook: { type: String, trim: true, default: "" },
            linkedin: { type: String, trim: true, default: "" },
            github: { type: String, trim: true, default: "" },
            instagram: { type: String, trim: true, default: "" },
            youtube: { type: String, trim: true, default: "" },
        },
        status: {
            type: String,
            enum: Object.values(BlogWebsiteStatus),
            default: BlogWebsiteStatus.ACTIVE,
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
        collection: "blog_websites",
    },
);

export const BlogWebsiteModel =
    mongoose.models.BlogWebsite ||
    mongoose.model<IBlogWebsiteDocument>("BlogWebsite", BlogWebsiteSchema);


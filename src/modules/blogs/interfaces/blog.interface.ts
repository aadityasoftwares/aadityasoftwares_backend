import { Document, Types } from "mongoose";
import {
    BlogAuthorStatus,
    BlogCategoryStatus,
    BlogContentFormat,
    BlogRedirectStatus,
    BlogRedirectType,
    BlogStatus,
    BlogTagStatus,
    BlogWebsiteStatus,
} from "../constants/blog.enums.js";

export interface IBlogSeo {
    title?: string;
    description?: string;
    canonicalUrl?: string;
    focusKeyword?: string;
    robots?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImageMediaId?: Types.ObjectId | string | null;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImageMediaId?: Types.ObjectId | string | null;
    schemaType?: string;
}

export interface IBlogWebsiteSocialLinks {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
    youtube?: string;
}

export interface IBlogWebsite {
    name: string;
    slug: string;
    domain: string;
    baseUrl: string;
    description?: string;
    logoMediaId?: Types.ObjectId | string | null;
    faviconMediaId?: Types.ObjectId | string | null;
    defaultAuthorId?: Types.ObjectId | string | null;
    defaultLanguage: string;
    defaultSeo?: IBlogSeo;
    socialLinks?: IBlogWebsiteSocialLinks;
    status: BlogWebsiteStatus;
    createdBy?: Types.ObjectId | string | null;
    updatedBy?: Types.ObjectId | string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBlogWebsiteDocument extends IBlogWebsite, Document {}

export interface IBlogCategory {
    websiteId: Types.ObjectId | string;
    name: string;
    slug: string;
    description?: string;
    parentCategoryId?: Types.ObjectId | string | null;
    featuredImageMediaId?: Types.ObjectId | string | null;
    seo?: IBlogSeo;
    status: BlogCategoryStatus;
    createdBy?: Types.ObjectId | string | null;
    updatedBy?: Types.ObjectId | string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBlogCategoryDocument extends IBlogCategory, Document {}

export interface IBlogTag {
    websiteId: Types.ObjectId | string;
    name: string;
    slug: string;
    description?: string;
    seo?: IBlogSeo;
    status: BlogTagStatus;
    createdBy?: Types.ObjectId | string | null;
    updatedBy?: Types.ObjectId | string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBlogTagDocument extends IBlogTag, Document {}

export interface IBlogAuthor {
    websiteId: Types.ObjectId | string;
    userId?: Types.ObjectId | string | null;
    name: string;
    slug: string;
    designation?: string;
    biography?: string;
    profileImageMediaId?: Types.ObjectId | string | null;
    socialLinks?: {
        website?: string;
        twitter?: string;
        linkedin?: string;
        github?: string;
    };
    status: BlogAuthorStatus;
    createdBy?: Types.ObjectId | string | null;
    updatedBy?: Types.ObjectId | string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBlogAuthorDocument extends IBlogAuthor, Document {}

export interface IBlog {
    websiteId: Types.ObjectId | string;
    title: string;
    slug: string;
    excerpt: string;
    content: any; // Structured JSON document
    contentFormat: BlogContentFormat;
    contentRawText?: string;
    featuredImageMediaId?: Types.ObjectId | string | null;
    featuredImageAlt?: string;
    categoryIds: (Types.ObjectId | string)[];
    tagIds: (Types.ObjectId | string)[];
    authorId: Types.ObjectId | string;
    coAuthorIds?: (Types.ObjectId | string)[];
    status: BlogStatus;
    publishedAt?: Date | null;
    scheduledAt?: Date | null;
    allowComments: boolean;
    isFeatured: boolean;
    allowIndexing: boolean;
    readingTime: number; // in minutes
    wordCount: number;
    seo?: IBlogSeo;
    createdBy?: Types.ObjectId | string | null;
    updatedBy?: Types.ObjectId | string | null;
    publishedBy?: Types.ObjectId | string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBlogDocument extends IBlog, Document {}

export interface IBlogRevision {
    websiteId: Types.ObjectId | string;
    blogId: Types.ObjectId | string;
    version: number;
    title: string;
    slug: string;
    excerpt: string;
    content: any;
    seo?: IBlogSeo;
    changeSummary?: string;
    createdBy: Types.ObjectId | string;
    createdAt?: Date;
}

export interface IBlogRevisionDocument extends IBlogRevision, Document {}

export interface IBlogRedirect {
    websiteId: Types.ObjectId | string;
    sourcePath: string;
    destinationPath: string;
    redirectType: BlogRedirectType;
    status: BlogRedirectStatus;
    createdBy?: Types.ObjectId | string | null;
    updatedBy?: Types.ObjectId | string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBlogRedirectDocument extends IBlogRedirect, Document {}

// Query Filter Interfaces
export interface IBlogFilter {
    websiteId?: string;
    search?: string;
    categoryId?: string;
    tagId?: string;
    authorId?: string;
    status?: BlogStatus;
    isFeatured?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface IBlogCategoryFilter {
    websiteId?: string;
    search?: string;
    parentCategoryId?: string | null;
    status?: BlogCategoryStatus;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface IBlogTagFilter {
    websiteId?: string;
    search?: string;
    status?: BlogTagStatus;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface IBlogAuthorFilter {
    websiteId?: string;
    search?: string;
    status?: BlogAuthorStatus;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface IBlogWebsiteFilter {
    search?: string;
    status?: BlogWebsiteStatus;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface IBlogRedirectFilter {
    websiteId?: string;
    search?: string;
    status?: BlogRedirectStatus;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}


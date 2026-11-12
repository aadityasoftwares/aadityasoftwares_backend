import type {
    IBlog,
    IBlogAuthor,
    IBlogCategory,
    IBlogSeo,
    IBlogTag,
    IBlogWebsite,
} from "../interfaces/blog.interface.js";
import { resolveMediaUrl, MEDIA_PLACEHOLDERS } from "../../../utils/mediaUrl.util.js";

export class BlogSeoService {
    /**
     * Resolves a safe canonical URL ensuring it belongs to the configured website.
     */
    static resolveCanonicalUrl(website: IBlogWebsite, customUrl?: string, defaultPath = "/blog"): string {
        const baseUrl = website.baseUrl.replace(/\/+$/, "");
        if (customUrl && typeof customUrl === "string" && customUrl.trim()) {
            const trimmed = customUrl.trim();
            try {
                const parsed = new URL(trimmed);
                const websiteParsed = new URL(baseUrl);
                // Validate origin matches the website
                if (parsed.origin.toLowerCase() === websiteParsed.origin.toLowerCase()) {
                    return parsed.origin + parsed.pathname;
                }
            } catch {
                // If relative path given, append to baseUrl
                if (trimmed.startsWith("/")) {
                    return `${baseUrl}${trimmed}`;
                }
            }
        }
        return `${baseUrl}${defaultPath}`;
    }

    /**
     * Resolves complete SEO metadata for an article with fallbacks.
     */
    static resolveArticleSeo(website: IBlogWebsite, blog: IBlog) {
        const canonicalUrl = this.resolveCanonicalUrl(website, blog.seo?.canonicalUrl, `/blog/${blog.slug}`);
        const title = blog.seo?.title || `${blog.title} | ${website.name}`;
        const description = blog.seo?.description || blog.excerpt;
        const robots = blog.allowIndexing ? (blog.seo?.robots || "index, follow") : "noindex, follow";

        const ogTitle = blog.seo?.ogTitle || blog.title;
        const ogDescription = blog.seo?.ogDescription || blog.excerpt;
        const twitterTitle = blog.seo?.twitterTitle || blog.title;
        const twitterDescription = blog.seo?.twitterDescription || blog.excerpt;

        const articleImageUrl =
            resolveMediaUrl(
                (blog.seo?.ogImageMediaId as any)?.publicUrl ||
                (blog.seo?.ogImageMediaId as any)?.storageKey ||
                (blog.featuredImageMediaId as any)?.publicUrl ||
                (blog.featuredImageMediaId as any)?.storageKey,
                MEDIA_PLACEHOLDERS.BLOG_FEATURED,
            ) || "";

        const twitterImageUrl =
            resolveMediaUrl(
                (blog.seo?.twitterImageMediaId as any)?.publicUrl ||
                (blog.seo?.twitterImageMediaId as any)?.storageKey ||
                articleImageUrl,
                MEDIA_PLACEHOLDERS.BLOG_FEATURED,
            ) || "";

        // Structured JSON-LD Data
        const structuredData = [
            this.generateArticleJsonLd(website, blog, canonicalUrl, articleImageUrl),
            this.generateBreadcrumbJsonLd(website, [
                { name: "Home", url: website.baseUrl },
                { name: "Blog", url: `${website.baseUrl}/blog` },
                { name: blog.title, url: canonicalUrl },
            ]),
        ];

        return {
            title,
            description,
            canonicalUrl,
            robots,
            focusKeyword: blog.seo?.focusKeyword || "",
            openGraph: {
                title: ogTitle,
                description: ogDescription,
                url: canonicalUrl,
                type: "article",
                publishedTime: blog.publishedAt,
                modifiedTime: blog.updatedAt,
                image: articleImageUrl,
            },
            twitter: {
                card: "summary_large_image",
                title: twitterTitle,
                description: twitterDescription,
                image: twitterImageUrl,
            },
            structuredData,
        };
    }

    /**
     * Resolves complete SEO metadata for Blog Home / Listing.
     */
    static resolveHomeSeo(website: IBlogWebsite) {
        const canonicalUrl = this.resolveCanonicalUrl(website, website.defaultSeo?.canonicalUrl, "/blog");
        const title = website.defaultSeo?.title || `${website.name} Blog - Articles & Insights`;
        const description = website.defaultSeo?.description || website.description || `Read latest articles from ${website.name}`;
        const robots = website.defaultSeo?.robots || "index, follow";

        const homeImageUrl =
            resolveMediaUrl(
                (website.defaultSeo?.ogImageMediaId as any)?.publicUrl ||
                (website.defaultSeo?.ogImageMediaId as any)?.storageKey ||
                (website.logoMediaId as any)?.publicUrl ||
                (website.logoMediaId as any)?.storageKey,
                MEDIA_PLACEHOLDERS.LOGO,
            ) || "";

        const twitterImageUrl =
            resolveMediaUrl(
                (website.defaultSeo?.twitterImageMediaId as any)?.publicUrl ||
                (website.defaultSeo?.twitterImageMediaId as any)?.storageKey ||
                homeImageUrl,
                MEDIA_PLACEHOLDERS.LOGO,
            ) || "";

        const structuredData = [
            this.generateOrganizationJsonLd(website),
            this.generateBreadcrumbJsonLd(website, [
                { name: "Home", url: website.baseUrl },
                { name: "Blog", url: canonicalUrl },
            ]),
        ];

        return {
            title,
            description,
            canonicalUrl,
            robots,
            openGraph: {
                title: website.defaultSeo?.ogTitle || title,
                description: website.defaultSeo?.ogDescription || description,
                url: canonicalUrl,
                type: "website",
                image: homeImageUrl,
            },
            twitter: {
                card: "summary_large_image",
                title: website.defaultSeo?.twitterTitle || title,
                description: website.defaultSeo?.twitterDescription || description,
                image: twitterImageUrl,
            },
            structuredData,
        };
    }

    /**
     * Resolves complete SEO metadata for a Category.
     */
    static resolveCategorySeo(website: IBlogWebsite, category: IBlogCategory) {
        const canonicalUrl = this.resolveCanonicalUrl(website, category.seo?.canonicalUrl, `/blog/category/${category.slug}`);
        const title = category.seo?.title || `${category.name} Articles | ${website.name}`;
        const description = category.seo?.description || category.description || `Articles filed under ${category.name}`;
        const robots = category.seo?.robots || "index, follow";

        const categoryImageUrl =
            resolveMediaUrl(
                (category.seo?.ogImageMediaId as any)?.publicUrl ||
                (category.seo?.ogImageMediaId as any)?.storageKey ||
                (category.featuredImageMediaId as any)?.publicUrl ||
                (category.featuredImageMediaId as any)?.storageKey ||
                (website.defaultSeo?.ogImageMediaId as any)?.publicUrl,
                MEDIA_PLACEHOLDERS.BLOG_FEATURED,
            ) || "";

        const structuredData = [
            this.generateBreadcrumbJsonLd(website, [
                { name: "Home", url: website.baseUrl },
                { name: "Blog", url: `${website.baseUrl}/blog` },
                { name: category.name, url: canonicalUrl },
            ]),
        ];

        return {
            title,
            description,
            canonicalUrl,
            robots,
            openGraph: {
                title: category.seo?.ogTitle || title,
                description: category.seo?.ogDescription || description,
                url: canonicalUrl,
                type: "website",
                image: categoryImageUrl,
            },
            structuredData,
        };
    }

    /**
     * Resolves complete SEO metadata for a Tag.
     */
    static resolveTagSeo(website: IBlogWebsite, tag: IBlogTag) {
        const canonicalUrl = this.resolveCanonicalUrl(website, tag.seo?.canonicalUrl, `/blog/tag/${tag.slug}`);
        const title = tag.seo?.title || `${tag.name} - Topics & Articles | ${website.name}`;
        const description = tag.seo?.description || tag.description || `Articles tagged with ${tag.name}`;
        const robots = tag.seo?.robots || "index, follow";

        return {
            title,
            description,
            canonicalUrl,
            robots,
            openGraph: {
                title,
                description,
                url: canonicalUrl,
                type: "website",
            },
        };
    }

    /**
     * Resolves complete SEO metadata for an Author.
     */
    static resolveAuthorSeo(website: IBlogWebsite, author: IBlogAuthor) {
        const canonicalUrl = `${website.baseUrl.replace(/\/+$/, "")}/blog/author/${author.slug}`;
        const title = `${author.name} - Author at ${website.name}`;
        const description = author.biography || `Read articles written by ${author.name}`;

        const authorImageUrl =
            resolveMediaUrl(
                (author.profileImageMediaId as any)?.publicUrl ||
                (author.profileImageMediaId as any)?.storageKey,
                MEDIA_PLACEHOLDERS.AVATAR,
            ) || "";

        const structuredData = [this.generatePersonJsonLd(author, canonicalUrl, authorImageUrl)];

        return {
            title,
            description,
            canonicalUrl,
            robots: "index, follow",
            openGraph: {
                title,
                description,
                url: canonicalUrl,
                type: "profile",
                image: authorImageUrl,
            },
            structuredData,
        };
    }

    /**
     * Schema.org Article JSON-LD
     */
    static generateArticleJsonLd(
        website: IBlogWebsite,
        blog: IBlog,
        canonicalUrl: string,
        imageUrl?: string,
    ) {
        const author = blog.authorId as any;
        const resolvedImage =
            imageUrl ||
            resolveMediaUrl(
                (blog.featuredImageMediaId as any)?.publicUrl ||
                (blog.featuredImageMediaId as any)?.storageKey,
                MEDIA_PLACEHOLDERS.BLOG_FEATURED,
            ) ||
            undefined;

        return {
            "@context": "https://schema.org",
            "@type": blog.seo?.schemaType || "Article",
            headline: blog.title,
            description: blog.excerpt,
            url: canonicalUrl,
            mainEntityOfPage: {
                "@type": "WebPage",
                "@id": canonicalUrl,
            },
            datePublished: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : undefined,
            dateModified: blog.updatedAt ? new Date(blog.updatedAt).toISOString() : undefined,
            author: author
                ? {
                      "@type": "Person",
                      name: author.name || "Author",
                      url: `${website.baseUrl.replace(/\/+$/, "")}/blog/author/${author.slug || ""}`,
                  }
                : undefined,
            publisher: {
                "@type": "Organization",
                name: website.name,
                url: website.baseUrl,
            },
            image: resolvedImage,
            wordCount: blog.wordCount,
        };
    }

    /**
     * Schema.org BreadcrumbList JSON-LD
     */
    static generateBreadcrumbJsonLd(
        website: IBlogWebsite,
        items: Array<{ name: string; url: string }>,
    ) {
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: items.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: item.name,
                item: item.url,
            })),
        };
    }

    /**
     * Schema.org Organization JSON-LD
     */
    static generateOrganizationJsonLd(website: IBlogWebsite) {
        const logoUrl = resolveMediaUrl(
            (website.logoMediaId as any)?.publicUrl ||
            (website.logoMediaId as any)?.storageKey,
            MEDIA_PLACEHOLDERS.LOGO,
        );

        return {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: website.name,
            url: website.baseUrl,
            description: website.description,
            logo: logoUrl || undefined,
            sameAs: Object.values(website.socialLinks || {}).filter(Boolean),
        };
    }

    /**
     * Schema.org Person JSON-LD
     */
    static generatePersonJsonLd(author: IBlogAuthor, canonicalUrl: string, imageUrl?: string) {
        const resolvedImage =
            imageUrl ||
            resolveMediaUrl(
                (author.profileImageMediaId as any)?.publicUrl ||
                (author.profileImageMediaId as any)?.storageKey,
                MEDIA_PLACEHOLDERS.AVATAR,
            ) ||
            undefined;

        return {
            "@context": "https://schema.org",
            "@type": "Person",
            name: author.name,
            jobTitle: author.designation,
            description: author.biography,
            url: canonicalUrl,
            image: resolvedImage,
            sameAs: Object.values(author.socialLinks || {}).filter(Boolean),
        };
    }
}


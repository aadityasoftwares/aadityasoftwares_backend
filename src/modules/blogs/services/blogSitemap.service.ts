import { BlogRepository } from "../repositories/blog.repository.js";
import { BlogCategoryRepository } from "../repositories/blogCategory.repository.js";
import { BlogAuthorRepository } from "../repositories/blogAuthor.repository.js";
import type { IBlogWebsite } from "../interfaces/blog.interface.js";
import { BlogCategoryStatus, BlogAuthorStatus } from "../constants/blog.enums.js";

export class BlogSitemapService {
    private blogRepo: BlogRepository;
    private categoryRepo: BlogCategoryRepository;
    private authorRepo: BlogAuthorRepository;

    constructor() {
        this.blogRepo = new BlogRepository();
        this.categoryRepo = new BlogCategoryRepository();
        this.authorRepo = new BlogAuthorRepository();
    }

    async generateXmlSitemap(website: IBlogWebsite): Promise<string> {
        const baseUrl = website.baseUrl.replace(/\/+$/, "");
        const websiteId = String((website as any)._id);

        const [articles, categoriesResult, authorsResult] = await Promise.all([
            this.blogRepo.findForSitemap(websiteId),
            this.categoryRepo.findAll({ websiteId, status: BlogCategoryStatus.ACTIVE, limit: 1000 }),
            this.authorRepo.findAll({ websiteId, status: BlogAuthorStatus.ACTIVE, limit: 1000 }),
        ]);

        const urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: string }> = [];

        // 1. Blog home
        urls.push({
            loc: `${baseUrl}/blog`,
            lastmod: new Date().toISOString().split("T")[0],
            changefreq: "daily",
            priority: "1.0",
        });

        // 2. Published articles
        for (const article of articles) {
            const date = article.updatedAt || article.publishedAt;
            urls.push({
                loc: `${baseUrl}/blog/${article.slug}`,
                lastmod: date ? new Date(date).toISOString().split("T")[0] : undefined,
                changefreq: "weekly",
                priority: "0.8",
            });
        }

        // 3. Categories
        for (const cat of categoriesResult.data) {
            urls.push({
                loc: `${baseUrl}/blog/category/${cat.slug}`,
                changefreq: "weekly",
                priority: "0.6",
            });
        }

        // 4. Authors
        for (const auth of authorsResult.data) {
            urls.push({
                loc: `${baseUrl}/blog/author/${auth.slug}`,
                changefreq: "monthly",
                priority: "0.5",
            });
        }

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        for (const item of urls) {
            xml += `  <url>\n`;
            xml += `    <loc>${item.loc}</loc>\n`;
            if (item.lastmod) xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
            if (item.changefreq) xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
            if (item.priority) xml += `    <priority>${item.priority}</priority>\n`;
            xml += `  </url>\n`;
        }

        xml += `</urlset>`;
        return xml;
    }

    generateRobotsTxt(website: IBlogWebsite): string {
        const baseUrl = website.baseUrl.replace(/\/+$/, "");
        return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/api/v1/public/blog/sitemap.xml\n`;
    }
}


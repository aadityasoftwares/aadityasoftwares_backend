import { BlogWebsiteModel } from "../../../modules/blogs/models/blogWebsite.model.js";
import { BlogWebsiteStatus } from "../../../modules/blogs/constants/blog.enums.js";

export const INITIAL_BLOG_WEBSITES = [
    {
        name: "Aaditya Softwares",
        slug: "aaditya-softwares",
        domain: "aadityasoftwares.in",
        baseUrl: "https://aadityasoftwares.in",
        description: "Official blog and technology insights from Aaditya Softwares",
        defaultLanguage: "en",
        status: BlogWebsiteStatus.ACTIVE,
        defaultSeo: {
            title: "Aaditya Softwares - Technology, Software & Engineering Blog",
            description: "Explore articles on web development, software engineering, architecture, and technology insights.",
            robots: "index, follow",
            schemaType: "Organization",
        },
    },
    {
        name: "StickyJi",
        slug: "stickyji",
        domain: "stickyji.com",
        baseUrl: "https://stickyji.com",
        description: "Official productivity, organization, and note-taking blog from StickyJi",
        defaultLanguage: "en",
        status: BlogWebsiteStatus.ACTIVE,
        defaultSeo: {
            title: "StickyJi - Productivity & Note-Taking Blog",
            description: "Tips, tutorials, workflows and updates for organizing your notes, tasks, and ideas with StickyJi.",
            robots: "index, follow",
            schemaType: "Organization",
        },
    },
];

export const executeBlogWebsitesSeed = async (): Promise<void> => {
    for (const site of INITIAL_BLOG_WEBSITES) {
        await BlogWebsiteModel.findOneAndUpdate(
            { slug: site.slug },
            {
                $setOnInsert: {
                    name: site.name,
                    slug: site.slug,
                    domain: site.domain,
                    baseUrl: site.baseUrl,
                    description: site.description,
                    defaultLanguage: site.defaultLanguage,
                    status: site.status,
                    defaultSeo: site.defaultSeo,
                },
            },
            { upsert: true, returnDocument: "after" },
        );
    }

    console.log(`Blog websites seeded successfully (${INITIAL_BLOG_WEBSITES.length} websites).`);
};


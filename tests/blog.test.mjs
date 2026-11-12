import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { setupTestServer, teardownTestServer, getAdminAuth } from "./testHelper.mjs";
import { runScheduledBlogPublish } from "../src/modules/blogs/schedulers/blogPublish.scheduler.ts";

describe("Blog Management Multi-Website Integration Tests", () => {
    let baseUrl;
    let adminToken;
    let aadityaWebsiteId;
    let stickyjiWebsiteId;

    let aadityaAuthorId;
    let aadityaCatTechId;
    let aadityaCatSubNodeId;
    let aadityaTagNodeId;
    let testBlogId;
    let scheduledBlogId;

    async function cleanupTestData() {
        const { BlogAuthorModel } = await import("../src/modules/blogs/models/blogAuthor.model.ts");
        const { BlogCategoryModel } = await import("../src/modules/blogs/models/blogCategory.model.ts");
        const { BlogTagModel } = await import("../src/modules/blogs/models/blogTag.model.ts");
        const { BlogModel } = await import("../src/modules/blogs/models/blog.model.ts");
        const { BlogRevisionModel } = await import("../src/modules/blogs/models/blogRevision.model.ts");
        const { BlogRedirectModel } = await import("../src/modules/blogs/models/blogRedirect.model.ts");

        await BlogModel.deleteMany({
            slug: {
                $in: [
                    "building-modern-backends-express-5",
                    "express-5-modern-backends-guide",
                    "scheduled-article-architecture",
                ],
            },
        });
        await BlogAuthorModel.deleteMany({ slug: "aaditya-patil" });
        await BlogCategoryModel.deleteMany({ slug: { $in: ["technology", "nodejs"] } });
        await BlogTagModel.deleteMany({ slug: "typescript" });
        await BlogRedirectModel.deleteMany({ sourcePath: "/blog/building-modern-backends-express-5" });
    }

    before(async () => {
        const env = await setupTestServer();
        baseUrl = env.baseUrl;
        adminToken = await getAdminAuth();
        await cleanupTestData();
    });

    after(async () => {
        await cleanupTestData();
        await teardownTestServer();
    });

    // -------------------------------------------------------------
    // 1. Website Discovery & Isolation
    // -------------------------------------------------------------
    test("Public: GET /public/blog/websites should list seeded websites", async () => {
        const res = await fetch(`${baseUrl}/public/blog/websites`);
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.success, true);
        assert.ok(body.data.length >= 2, "Should have at least 2 seeded websites");

        const aadityaSite = body.data.find((w) => w.slug === "aaditya-softwares");
        const stickyjiSite = body.data.find((w) => w.slug === "stickyji");
        assert.ok(aadityaSite, "Aaditya Softwares website must exist");
        assert.ok(stickyjiSite, "StickyJi website must exist");

        aadityaWebsiteId = aadityaSite._id;
        stickyjiWebsiteId = stickyjiSite._id;
    });

    test("Public: GET /public/blog/websites/:websiteSlug should return website with resolved SEO", async () => {
        const res = await fetch(`${baseUrl}/public/blog/websites/aaditya-softwares`);
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.success, true);
        assert.equal(body.data.slug, "aaditya-softwares");
        assert.ok(body.data.resolvedSeo, "Must include resolved home SEO metadata");
        assert.equal(body.data.resolvedSeo.canonicalUrl, "https://aadityasoftwares.in/blog");
    });

    // -------------------------------------------------------------
    // 2. Author Management
    // -------------------------------------------------------------
    test("Admin: POST /blogs/authors should create an author for Aaditya Softwares", async () => {
        const res = await fetch(`${baseUrl}/blogs/authors`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                websiteId: aadityaWebsiteId,
                name: "Aaditya Patil",
                slug: "aaditya-patil",
                designation: "Founder & Lead Architect",
                biography: "Full-stack engineer and architect.",
                socialLinks: {
                    twitter: "https://twitter.com/aaditya",
                    github: "https://github.com/aaditya",
                },
            }),
        });

        assert.equal(res.status, 201);
        const body = await res.json();
        assert.equal(body.success, true);
        assert.equal(body.data.name, "Aaditya Patil");
        assert.equal(body.data.slug, "aaditya-patil");
        aadityaAuthorId = body.data._id;
    });

    test("Admin: POST /blogs/authors should reject duplicate author slug within the same website", async () => {
        const res = await fetch(`${baseUrl}/blogs/authors`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                websiteId: aadityaWebsiteId,
                name: "Duplicate Author",
                slug: "aaditya-patil",
            }),
        });

        assert.equal(res.status, 409);
        const body = await res.json();
        assert.equal(body.success, false);
    });

    test("Admin: POST /blogs/authors allows same slug in a DIFFERENT website (Multi-website isolation)", async () => {
        const res = await fetch(`${baseUrl}/blogs/authors`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                websiteId: stickyjiWebsiteId,
                name: "Aaditya Patil (StickyJi)",
                slug: "aaditya-patil", // Same slug, different websiteId
            }),
        });

        assert.equal(res.status, 201);
        const body = await res.json();
        assert.equal(body.success, true);
        assert.equal(body.data.websiteId, stickyjiWebsiteId);
    });

    // -------------------------------------------------------------
    // 3. Category Management & Circular Prevention
    // -------------------------------------------------------------
    test("Admin: POST /blogs/categories should create parent and child categories", async () => {
        // Parent: Technology
        const parentRes = await fetch(`${baseUrl}/blogs/categories`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                websiteId: aadityaWebsiteId,
                name: "Technology",
                slug: "technology",
                description: "Engineering & software articles",
            }),
        });

        assert.equal(parentRes.status, 201);
        const parentBody = await parentRes.json();
        aadityaCatTechId = parentBody.data._id;

        // Child: Node.js
        const childRes = await fetch(`${baseUrl}/blogs/categories`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                websiteId: aadityaWebsiteId,
                name: "Node.js",
                slug: "nodejs",
                parentCategoryId: aadityaCatTechId,
            }),
        });

        assert.equal(childRes.status, 201);
        const childBody = await childRes.json();
        aadityaCatSubNodeId = childBody.data._id;
        assert.equal(
            String(childBody.data.parentCategoryId?._id || childBody.data.parentCategoryId),
            String(aadityaCatTechId),
        );
    });

    test("Admin: PUT /blogs/categories/:id should reject circular category parentage", async () => {
        // Attempt to make parent's parent the child (Technology -> parent: Node.js)
        const res = await fetch(`${baseUrl}/blogs/categories/${aadityaCatTechId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                parentCategoryId: aadityaCatSubNodeId,
            }),
        });

        assert.equal(res.status, 400);
        const body = await res.json();
        assert.equal(body.success, false);
    });

    // -------------------------------------------------------------
    // 4. Tag Management
    // -------------------------------------------------------------
    test("Admin: POST /blogs/tags should create a tag", async () => {
        const res = await fetch(`${baseUrl}/blogs/tags`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                websiteId: aadityaWebsiteId,
                name: "TypeScript",
                slug: "typescript",
            }),
        });

        assert.equal(res.status, 201);
        const body = await res.json();
        aadityaTagNodeId = body.data._id;
    });

    // -------------------------------------------------------------
    // 5. Blog Creation, Analytics & Draft Protection
    // -------------------------------------------------------------
    test("Admin: POST /blogs should create a DRAFT blog with auto word count and reading time", async () => {
        const res = await fetch(`${baseUrl}/blogs`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                websiteId: aadityaWebsiteId,
                title: "Building Modern Backends with Express 5",
                slug: "building-modern-backends-express-5",
                excerpt: "A comprehensive guide on Express 5, TypeScript and Mongoose architecture.",
                content: {
                    blocks: [
                        { text: "Express 5 introduces native promise handling and modern routing." },
                        { text: "Pairing it with TypeScript ensures enterprise-grade reliability and typing." },
                        { text: "This article demonstrates modular clean architecture without bloated frameworks." },
                    ],
                },
                authorId: aadityaAuthorId,
                categoryIds: [aadityaCatTechId, aadityaCatSubNodeId],
                tagIds: [aadityaTagNodeId],
                status: "DRAFT",
            }),
        });

        assert.equal(res.status, 201);
        const body = await res.json();
        assert.equal(body.success, true);
        assert.equal(body.data.status, "DRAFT");
        assert.ok(body.data.wordCount > 0, "Word count should be calculated");
        assert.ok(body.data.readingTime >= 1, "Reading time should be at least 1 minute");
        testBlogId = body.data._id;
    });

    test("Public: GET /public/blog should NOT return draft articles (Draft Protection)", async () => {
        const res = await fetch(`${baseUrl}/public/blog`, {
            headers: { "x-website-slug": "aaditya-softwares" },
        });

        assert.equal(res.status, 200);
        const body = await res.json();
        const found = body.data.find((b) => b._id === testBlogId);
        assert.equal(found, undefined, "DRAFT article must NOT appear in public listing");
    });

    test("Public: GET /public/blog/:slug should return 404 for draft articles", async () => {
        const res = await fetch(`${baseUrl}/public/blog/building-modern-backends-express-5`, {
            headers: { "x-website-slug": "aaditya-softwares" },
        });

        assert.equal(res.status, 404);
        const body = await res.json();
        assert.equal(body.success, false);
    });

    // -------------------------------------------------------------
    // 6. Publishing, Auto-Redirect & Revision Management
    // -------------------------------------------------------------
    test("Admin: POST /blogs/:id/publish should publish the article", async () => {
        const res = await fetch(`${baseUrl}/blogs/${testBlogId}/publish`, {
            method: "POST",
            headers: { Authorization: `Bearer ${adminToken}` },
        });

        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.data.status, "PUBLISHED");
        assert.ok(body.data.publishedAt, "Must have publication timestamp");
    });

    test("Public: GET /public/blog/:slug should return published article with resolved SEO & JSON-LD", async () => {
        const res = await fetch(`${baseUrl}/public/blog/building-modern-backends-express-5`, {
            headers: { "x-website-slug": "aaditya-softwares" },
        });

        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.success, true);
        assert.equal(body.data.slug, "building-modern-backends-express-5");
        assert.ok(body.data.resolvedSeo, "Must include resolved SEO");
        assert.equal(
            body.data.resolvedSeo.canonicalUrl,
            "https://aadityasoftwares.in/blog/building-modern-backends-express-5",
        );
        assert.ok(Array.isArray(body.data.resolvedSeo.structuredData), "Must include JSON-LD array");
    });

    test("Admin: Changing slug of published blog should automatically create 301 redirect", async () => {
        const res = await fetch(`${baseUrl}/blogs/${testBlogId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                slug: "express-5-modern-backends-guide",
            }),
        });

        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.data.slug, "express-5-modern-backends-guide");

        // Verify redirect was created
        const redirectRes = await fetch(
            `${baseUrl}/public/blog/redirects/lookup?path=/blog/building-modern-backends-express-5`,
            { headers: { "x-website-slug": "aaditya-softwares" } },
        );

        assert.equal(redirectRes.status, 200);
        const redirectBody = await redirectRes.json();
        assert.equal(redirectBody.success, true);
        assert.equal(redirectBody.data.destinationPath, "/blog/express-5-modern-backends-guide");
        assert.equal(redirectBody.data.redirectType, 301);
    });

    test("Admin: Revision history should exist and support revision restoration", async () => {
        const res = await fetch(`${baseUrl}/blogs/${testBlogId}/revisions`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });

        assert.equal(res.status, 200);
        const body = await res.json();
        assert.ok(body.data.length >= 2, "Should have at least 2 revisions");
        const rev1 = body.data.find((r) => r.version === 1);
        assert.ok(rev1, "Revision 1 should exist");

        // Restore Revision 1
        const restoreRes = await fetch(`${baseUrl}/blogs/${testBlogId}/revisions/${rev1._id}/restore`, {
            method: "POST",
            headers: { Authorization: `Bearer ${adminToken}` },
        });

        assert.equal(restoreRes.status, 200);
        const restoreBody = await restoreRes.json();
        assert.equal(restoreBody.data.slug, rev1.slug); // Restored original slug
    });

    // -------------------------------------------------------------
    // 7. Scheduled Publishing Workflow
    // -------------------------------------------------------------
    test("Admin: POST /blogs should create a SCHEDULED blog and scheduler should publish it", async () => {
        // Schedule article for a few seconds in the past to simulate due time
        const pastDate = new Date(Date.now() - 5000);

        // First create as DRAFT
        const createRes = await fetch(`${baseUrl}/blogs`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                websiteId: aadityaWebsiteId,
                title: "Scheduled Article on Architecture",
                slug: "scheduled-article-architecture",
                excerpt: "Automated publishing test.",
                content: { text: "Testing scheduled cron executor." },
                authorId: aadityaAuthorId,
                status: "DRAFT",
            }),
        });

        assert.equal(createRes.status, 201);
        const createBody = await createRes.json();
        scheduledBlogId = createBody.data._id;

        // Set status to SCHEDULED directly via database model to simulate arrival at execution time
        const { BlogModel } = await import("../src/modules/blogs/models/blog.model.ts");
        await BlogModel.findByIdAndUpdate(scheduledBlogId, {
            status: "SCHEDULED",
            scheduledAt: pastDate,
        });

        // Trigger scheduler worker directly
        const schedulerResult = await runScheduledBlogPublish();
        assert.ok(schedulerResult.publishedCount >= 1, "Scheduler must publish due articles");

        // Verify blog is now PUBLISHED
        const check = await BlogModel.findById(scheduledBlogId).lean();
        assert.equal(check.status, "PUBLISHED");
    });

    // -------------------------------------------------------------
    // 8. Sitemap & Robots.txt
    // -------------------------------------------------------------
    test("Public: GET /public/blog/sitemap.xml should return valid XML sitemap with canonical URLs", async () => {
        const res = await fetch(`${baseUrl}/public/blog/sitemap.xml`, {
            headers: { "x-website-slug": "aaditya-softwares" },
        });

        assert.equal(res.status, 200);
        assert.equal(res.headers.get("content-type"), "application/xml; charset=utf-8");
        const xml = await res.text();
        assert.ok(xml.includes("<urlset"), "Must be a valid sitemap urlset");
        assert.ok(xml.includes("https://aadityasoftwares.in/blog"), "Must include home blog URL");
        assert.ok(xml.includes("<loc>"), "Must include loc elements");
    });

    test("Public: GET /public/blog/robots.txt should return robots directive pointing to sitemap", async () => {
        const res = await fetch(`${baseUrl}/public/blog/robots.txt`, {
            headers: { "x-website-slug": "aaditya-softwares" },
        });

        assert.equal(res.status, 200);
        const text = await res.text();
        assert.ok(text.includes("User-agent: *"));
        assert.ok(text.includes("Sitemap: https://aadityasoftwares.in/api/v1/public/blog/sitemap.xml"));
    });

    // -------------------------------------------------------------
    // 9. Multi-Website Isolation & Related Articles
    // -------------------------------------------------------------
    test("Public: Articles of Aaditya Softwares should NOT leak into StickyJi", async () => {
        const res = await fetch(`${baseUrl}/public/blog`, {
            headers: { "x-website-slug": "stickyji" },
        });

        assert.equal(res.status, 200);
        const body = await res.json();
        const foundAadityaArticle = body.data.find((b) => b.slug === "express-5-modern-backends-guide");
        assert.equal(foundAadityaArticle, undefined, "Aaditya article must not appear on StickyJi");
    });
});


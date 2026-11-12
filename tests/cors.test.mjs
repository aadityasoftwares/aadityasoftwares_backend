import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { setupTestServer, teardownTestServer } from "./testHelper.mjs";

describe("CORS Configuration Tests", () => {
    let baseUrl;

    before(async () => {
        const env = await setupTestServer();
        baseUrl = env.baseUrl;
    });

    after(async () => {
        await teardownTestServer();
    });

    test("OPTIONS preflight from http://localhost:4200 with x-website-slug header", async () => {
        const res = await fetch(`${baseUrl}/public/blog?websiteSlug=aaditya-softwares`, {
            method: "OPTIONS",
            headers: {
                Origin: "http://localhost:4200",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "content-type, x-website-slug",
            },
        });

        assert.ok([200, 204].includes(res.status), `Expected 200 or 204 but got ${res.status}`);
        assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:4200");
        const allowedHeaders = res.headers.get("access-control-allow-headers") || "";
        assert.ok(
            allowedHeaders.toLowerCase().includes("x-website-slug"),
            `Allowed headers must include x-website-slug, got: ${allowedHeaders}`,
        );
    });

    test("GET /public/blog/categories from http://localhost:4200 should return CORS headers and 200 OK", async () => {
        const res = await fetch(`${baseUrl}/public/blog/categories?websiteSlug=aaditya-softwares`, {
            method: "GET",
            headers: {
                Origin: "http://localhost:4200",
            },
        });

        assert.equal(res.status, 200);
        assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:4200");
        const body = await res.json();
        assert.equal(body.success, true);
    });
});


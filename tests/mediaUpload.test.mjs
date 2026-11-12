import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { setupTestServer, teardownTestServer, getAdminAuth } from "./testHelper.mjs";

describe("Media Upload Integration Tests", () => {
    let baseUrl;
    let adminToken;

    before(async () => {
        const env = await setupTestServer();
        baseUrl = env.baseUrl;
        adminToken = await getAdminAuth();
    });

    after(async () => {
        await teardownTestServer();
    });

    test("POST /api/v1/media/requestupload should succeed with resourceType BLOG and no resourceId", async () => {
        const payload = {
            fileName: "contraversy.png",
            mimeType: "image/png",
            size: 2168338,
            mediaType: "IMAGE",
            purpose: "COVER",
            visibility: "PUBLIC",
            resourceType: "BLOG",
        };

        const res = await fetch(`${baseUrl}/media/requestupload`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify(payload),
        });

        const body = await res.json();
        assert.equal(res.status, 201, `Expected 201 but got ${res.status}: ${JSON.stringify(body)}`);
        assert.equal(body.success, true);
        assert.ok(body.data.mediaId, "Must return mediaId");
        assert.ok(body.data.uploadUrl, "Must return presigned R2 uploadUrl");
        assert.ok(body.data.storageKey, "Must return storageKey");
        assert.ok(body.data.storageKey.includes("/covers/"), "Storage key must include covers folder");
    });
});


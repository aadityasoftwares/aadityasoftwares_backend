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

    test("End-to-End: Request upload, PUT file to Cloudflare R2 presigned URL, and Complete upload", async () => {
        // 1x1 valid PNG
        const realPngBuffer = Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "base64",
        );

        // 1. Request Upload
        const reqRes = await fetch(`${baseUrl}/media/requestupload`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                fileName: "e2e-test-cover.png",
                mimeType: "image/png",
                size: realPngBuffer.length,
                mediaType: "IMAGE",
                purpose: "COVER",
                visibility: "PUBLIC",
                resourceType: "BLOG",
            }),
        });

        assert.equal(reqRes.status, 201);
        const reqBody = await reqRes.json();
        const { uploadUrl, mediaId, storageKey } = reqBody.data;

        // Verify signed headers only sign content-type and host (no if-none-match or content-length mismatch)
        const parsedUrl = new URL(uploadUrl);
        const signedHeaders = parsedUrl.searchParams.get("X-Amz-SignedHeaders") || "";
        assert.ok(signedHeaders.includes("content-type"));
        assert.ok(!signedHeaders.includes("if-none-match"), "Must not sign if-none-match header");

        // 2. PUT binary file directly to Cloudflare R2 presigned URL (like browser does)
        const putRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "image/png",
            },
            body: realPngBuffer,
        });

        assert.equal(putRes.status, 200, `Expected 200 from Cloudflare R2 PUT but got ${putRes.status}`);

        // 3. Complete Upload
        const compRes = await fetch(`${baseUrl}/media/${mediaId}/complete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
        });

        assert.equal(compRes.status, 200);
        const compBody = await compRes.json();
        assert.equal(compBody.success, true);
        assert.ok(compBody.data.publicUrl, "Must have publicUrl");
        assert.ok(
            compBody.data.publicUrl.startsWith("https://media.aadityasoftwares.in/"),
            `Public URL must use media base domain, got: ${compBody.data.publicUrl}`,
        );
    });
});


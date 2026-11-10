import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { setupTestServer, teardownTestServer, getAdminAuth } from "./testHelper.mjs";

describe("1. Authentication & Foundation Integration Tests", () => {
    let baseUrl;

    before(async () => {
        const env = await setupTestServer();
        baseUrl = env.baseUrl;
    });

    after(async () => {
        await teardownTestServer();
    });

    test("GET /health should return 200 OK and healthy status", async () => {
        const rootUrl = baseUrl.replace("/api/v1", "");
        const res = await fetch(`${rootUrl}/health`);
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.success, true);
        assert.equal(body.status, "healthy");
        assert.equal(body.service, "Aaditya Softwares Backend");
    });

    test("POST /api/v1/auth/login should fail with invalid credentials", async () => {
        const res = await fetch(`${baseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "admin@aadityasoftwares.com",
                password: "WrongPassword999!",
            }),
        });

        assert.equal(res.status, 401);
        const body = await res.json();
        assert.equal(body.success, false);
    });

    test("POST /api/v1/auth/login should succeed for seeded super admin", async () => {
        const token = await getAdminAuth();
        assert.ok(token, "Access token must be returned");
        assert.ok(token.length > 20, "Access token should be a valid JWT string");
    });

    test("GET /api/v1/auth/me should return current super admin details and permissions", async () => {
        const token = await getAdminAuth();
        const res = await fetch(`${baseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.success, true);
        assert.equal(body.data.email, "admin@aadityasoftwares.com");
        assert.ok(body.data.role, "Role should be populated");
        assert.equal(body.data.role.code, "SUPER_ADMIN");
        assert.ok(body.data.permissions.length >= 24, "Super Admin should have all seeded permissions");
    });

    test("GET /api/v1/roles should return seeded roles", async () => {
        const token = await getAdminAuth();
        const res = await fetch(`${baseUrl}/roles`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.success, true);
        assert.ok(body.data.length >= 4, "Should have at least 4 roles");
        const codes = body.data.map((r) => r.code);
        assert.ok(codes.includes("SUPER_ADMIN"));
        assert.ok(codes.includes("ADMIN"));
        assert.ok(codes.includes("MANAGER"));
        assert.ok(codes.includes("EMPLOYEE"));
    });
});


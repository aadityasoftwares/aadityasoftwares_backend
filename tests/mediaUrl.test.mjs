import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
    resolveMediaUrl,
    resolveRichTextMediaUrls,
    formatMediaObject,
    formatMediaArray,
    MEDIA_PLACEHOLDERS,
    MEDIA_BASE_URL,
} from "../src/utils/mediaUrl.util.ts";

describe("Media URL Utility Tests", () => {
    test("Centralized config base domain", () => {
        assert.equal(MEDIA_BASE_URL, "https://media.aadityasoftwares.in");
    });

    test("Relative storage key paths without slash", () => {
        assert.equal(
            resolveMediaUrl("accounts/123/cover.png"),
            "https://media.aadityasoftwares.in/accounts/123/cover.png",
        );
    });

    test("Relative storage key paths with leading slash (no double slashes)", () => {
        assert.equal(
            resolveMediaUrl("/accounts/123/cover.png"),
            "https://media.aadityasoftwares.in/accounts/123/cover.png",
        );
    });

    test("Rewrite old domain aadityasoftwares.fun to media.aadityasoftwares.in", () => {
        assert.equal(
            resolveMediaUrl("https://aadityasoftwares.fun/accounts/123/cover.png"),
            "https://media.aadityasoftwares.in/accounts/123/cover.png",
        );
    });

    test("Rewrite old domain aadityasoftwares.in to media.aadityasoftwares.in", () => {
        assert.equal(
            resolveMediaUrl("https://aadityasoftwares.in/accounts/123/cover.png"),
            "https://media.aadityasoftwares.in/accounts/123/cover.png",
        );
    });

    test("Rewrite old domain media.stickyji.com to media.aadityasoftwares.in", () => {
        assert.equal(
            resolveMediaUrl("https://media.stickyji.com/accounts/123/cover.png"),
            "https://media.aadityasoftwares.in/accounts/123/cover.png",
        );
    });

    test("Rewrite localhost/server IP to media.aadityasoftwares.in", () => {
        assert.equal(
            resolveMediaUrl("http://localhost:5050/accounts/123/cover.png"),
            "https://media.aadityasoftwares.in/accounts/123/cover.png",
        );
        assert.equal(
            resolveMediaUrl("http://127.0.0.1:5050/accounts/123/cover.png"),
            "https://media.aadityasoftwares.in/accounts/123/cover.png",
        );
    });

    test("Rewrite R2 cloud storage URLs to media.aadityasoftwares.in", () => {
        assert.equal(
            resolveMediaUrl("https://pub-abc123.r2.dev/accounts/123/cover.png"),
            "https://media.aadityasoftwares.in/accounts/123/cover.png",
        );
    });

    test("Preserve valid third-party external URLs", () => {
        const external = "https://lh3.googleusercontent.com/a/AGNmyxajf829";
        assert.equal(resolveMediaUrl(external), external);
    });

    test("Null/empty values with fallback", () => {
        assert.equal(resolveMediaUrl(null), null);
        assert.equal(resolveMediaUrl(""), null);
        assert.equal(
            resolveMediaUrl(null, MEDIA_PLACEHOLDERS.AVATAR),
            "https://media.aadityasoftwares.in/placeholders/default-avatar.png",
        );
    });

    test("Rich text / HTML content rewriting", () => {
        const html = '<p>Photo: <img src="/accounts/user1/pic.jpg" alt="pic"> and <img src="https://aadityasoftwares.fun/accounts/user1/pic2.jpg"></p>';
        const result = resolveRichTextMediaUrls(html);
        assert.ok(result.includes('src="https://media.aadityasoftwares.in/accounts/user1/pic.jpg"'));
        assert.ok(result.includes('src="https://media.aadityasoftwares.in/accounts/user1/pic2.jpg"'));
    });

    test("Structured JSON / EditorJS image blocks rewriting", () => {
        const blocks = {
            blocks: [
                {
                    type: "image",
                    data: {
                        file: {
                            url: "accounts/blog/chart.png",
                        },
                    },
                },
            ],
        };
        const result = resolveRichTextMediaUrls(blocks);
        assert.equal(
            result.blocks[0].data.file.url,
            "https://media.aadityasoftwares.in/accounts/blog/chart.png",
        );
    });

    test("formatMediaObject and formatMediaArray", () => {
        const media = {
            _id: "6af29c4b650621cdb660c850",
            storageKey: "accounts/user1/profile.png",
            publicUrl: "https://aadityasoftwares.in/accounts/user1/profile.png",
        };
        const formatted = formatMediaObject(media);
        assert.equal(formatted.publicUrl, "https://media.aadityasoftwares.in/accounts/user1/profile.png");

        const arr = formatMediaArray([media]);
        assert.equal(arr[0].publicUrl, "https://media.aadityasoftwares.in/accounts/user1/profile.png");
    });
});


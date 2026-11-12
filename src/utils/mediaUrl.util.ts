import { MEDIA_BASE_URL } from "../config/cloudflareR2.config.js";

export { MEDIA_BASE_URL };

export const MEDIA_PLACEHOLDERS = {
    AVATAR: `${MEDIA_BASE_URL}/placeholders/default-avatar.png`,
    BLOG_FEATURED: `${MEDIA_BASE_URL}/placeholders/default-blog.png`,
    LOGO: `${MEDIA_BASE_URL}/placeholders/default-logo.png`,
    ICON: `${MEDIA_BASE_URL}/placeholders/default-icon.png`,
} as const;

// Domains / patterns that point to our media storage and should be normalized to MEDIA_BASE_URL
const INTERNAL_STORAGE_HOSTS = [
    "media.aadityasoftwares.in",
    "aadityasoftwares.in",
    "aadityasoftwares.fun",
    "www.aadityasoftwares.in",
    "www.aadityasoftwares.fun",
    "media.stickyji.com",
    "stickyji.com",
    "www.stickyji.com",
    "localhost",
    "127.0.0.1",
];

/**
 * Normalizes any relative storage key, full URL with old/legacy domains,
 * localhost, or S3/R2 direct link into a consistent https://media.aadityasoftwares.in URL.
 *
 * - Avoids double slashes //
 * - Handles null/undefined/empty cleanly with optional fallback
 * - Avoids duplicate prefixes if already using MEDIA_BASE_URL
 * - Preserves third-party external URLs (e.g. Google OAuth avatars, GitHub avatars, Gravatar)
 */
export function resolveMediaUrl(
    pathOrUrl?: string | null,
    fallback?: string | null,
): string | null {
    if (!pathOrUrl || typeof pathOrUrl !== "string" || !pathOrUrl.trim()) {
        if (fallback) {
            return resolveMediaUrl(fallback, null);
        }
        return null;
    }

    const trimmed = pathOrUrl.trim();

    // Data URLs or blob URLs should be left intact
    if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
        return trimmed;
    }

    // Full HTTP/HTTPS URLs
    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const parsed = new URL(trimmed);
            const hostname = parsed.hostname.toLowerCase();

            // Check if this host is one of our internal media domains, legacy domains, cloud buckets, or local dev
            const isInternalStorage =
                INTERNAL_STORAGE_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`)) ||
                hostname.includes("r2.cloudflarestorage.com") ||
                hostname.includes("r2.dev") ||
                hostname.includes("amazonaws.com");

            if (isInternalStorage) {
                // Extract relative path (everything after domain)
                let relativePath = parsed.pathname.replace(/^\/+/, "");
                if (parsed.search) {
                    relativePath += parsed.search;
                }
                return `${MEDIA_BASE_URL}/${relativePath}`.replace(/([^:]\/)\/+/g, "$1");
            }

            // External third-party URL (e.g. https://lh3.googleusercontent.com/..., avatars.githubusercontent.com)
            return trimmed;
        } catch {
            // If URL parsing fails, treat as relative path below
        }
    }

    // Relative path (e.g. "accounts/..." or "/accounts/...")
    const cleanPath = trimmed.replace(/^\/+/, "");
    return `${MEDIA_BASE_URL}/${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
}

/**
 * Transforms a media record (e.g. populated Mongoose document or lean object)
 * to ensure publicUrl / url are properly prefixed with MEDIA_BASE_URL.
 */
export function formatMediaObject<T = any>(media: T): T {
    if (!media || typeof media !== "object") {
        return media;
    }

    const raw = typeof (media as any).toObject === "function" ? (media as any).toObject() : { ...media };

    // If it has storageKey or existing publicUrl, construct normalized publicUrl
    if (raw.storageKey || raw.publicUrl) {
        raw.publicUrl = resolveMediaUrl(raw.storageKey || raw.publicUrl);
    }
    if (raw.url) {
        raw.url = resolveMediaUrl(raw.storageKey || raw.url);
    }

    return raw;
}

/**
 * Formats an array of media records or items containing media.
 */
export function formatMediaArray<T = any>(items: T[]): T[] {
    if (!Array.isArray(items)) return [];
    return items.map((item) => formatMediaObject(item));
}

/**
 * Rewrites image URLs inside Rich Text / HTML content (e.g. <img src="...">)
 * or structured JSON / block content (e.g. EditorJS, Quill Delta) to use MEDIA_BASE_URL.
 */
export function resolveRichTextMediaUrls(content: any): any {
    if (!content) return content;

    if (typeof content === "string") {
        // Rewrite <img src="..." and srcset="..."
        return content.replace(
            /(<img\b[^>]*?\bsrc=["'])([^"']+)(["'][^>]*>)/gi,
            (match, prefix, src, suffix) => {
                const resolved = resolveMediaUrl(src);
                return `${prefix}${resolved || src}${suffix}`;
            },
        );
    }

    if (typeof content === "object") {
        // Deep clone to avoid mutating in-place
        const clone = Array.isArray(content) ? [...content] : { ...content };

        const walk = (node: any) => {
            if (!node || typeof node !== "object") return;

            // EditorJS image block: { type: "image", data: { file: { url: "..." } } }
            if (node.file && typeof node.file.url === "string") {
                node.file.url = resolveMediaUrl(node.file.url);
            }

            // Quill Delta image insert: { insert: { image: "..." } }
            if (node.insert && typeof node.insert.image === "string") {
                node.insert.image = resolveMediaUrl(node.insert.image);
            }

            for (const key of Object.keys(node)) {
                const val = node[key];
                if (typeof val === "string") {
                    if (["url", "imageUrl", "src", "publicUrl"].includes(key)) {
                        node[key] = resolveMediaUrl(val);
                    } else if (val.includes("<img")) {
                        node[key] = resolveRichTextMediaUrls(val);
                    }
                } else if (typeof val === "object") {
                    walk(val);
                }
            }
        };

        walk(clone);
        return clone;
    }

    return content;
}


import type { CorsOptions } from "cors";

export function getAllowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
    const rawOrigins = [
        env.CLIENT_URL,
        env.CORS_ALLOWED_ORIGINS,
        env.FRONTEND_URL,
        env.FRONTEND_APP_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "https://aadityasoftwares.in",
        "https://www.aadityasoftwares.in",
        "https://media.aadityasoftwares.in",
        "https://aadityasoftwares.fun",
        "https://www.aadityasoftwares.fun",
        "https://stickyji.com",
        "https://www.stickyji.com",
    ]
        .flatMap((value) => value?.split(",") ?? [])
        .map((value) => value.trim())
        .filter(Boolean);

    const validOrigins: string[] = [];
    for (const origin of rawOrigins) {
        try {
            const url = new URL(origin);
            validOrigins.push(url.origin);
        } catch {
            // Ignore malformed env strings safely
        }
    }

    return [...new Set(validOrigins)];
}

export function createCorsOptions(env: NodeJS.ProcessEnv = process.env): CorsOptions {
    const isDev = !env.NODE_ENV || env.NODE_ENV === "development" || env.NODE_ENV === "test";
    const allowedList = getAllowedOrigins(env);

    return {
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
            if (!origin) {
                return callback(null, true);
            }

            // In development or test, allow all localhost and 127.0.0.1 origins on any port
            if (
                isDev ||
                /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
                /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
            ) {
                return callback(null, true);
            }

            // Check against allowed list and production domains
            if (
                allowedList.includes(origin) ||
                origin.endsWith(".aadityasoftwares.in") ||
                origin.endsWith(".aadityasoftwares.fun") ||
                origin.endsWith(".stickyji.com") ||
                origin === "https://aadityasoftwares.in" ||
                origin === "https://aadityasoftwares.fun" ||
                origin === "https://stickyji.com"
            ) {
                return callback(null, true);
            }

            // Fallback for public API consumers
            return callback(null, true);
        },
        methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        exposedHeaders: ["Content-Range", "X-Content-Range"],
        credentials: true,
        maxAge: 86400,
        optionsSuccessStatus: 200,
    };
}

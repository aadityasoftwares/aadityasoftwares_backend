import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../src/app.ts";
import { mongoConnectionOptions } from "../src/config/mongoConnectionOptions.ts";

dotenv.config({ path: ".env", quiet: true });

let server;
let baseUrl = "";
let cachedToken = "";

export async function setupTestServer() {
    if (!mongoose.connection.readyState) {
        const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/aaditya_softwares_db";
        await mongoose.connect(uri, mongoConnectionOptions({ serverSelectionTimeoutMS: 5000 }));
    }

    if (!server) {
        await new Promise((resolve) => {
            server = app.listen(0, () => {
                const port = server.address().port;
                baseUrl = `http://127.0.0.1:${port}/api/v1`;
                resolve();
            });
        });
    }

    return { baseUrl, server };
}

export async function getAdminAuth() {
    if (cachedToken) {
        return cachedToken;
    }

    const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: process.env.ADMIN_EMAIL || "admin@aadityasoftwares.com",
            password: process.env.ADMIN_PASSWORD || "Admin@123456",
        }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(`Admin login failed: ${JSON.stringify(data)}`);
    }

    cachedToken = data.data.tokens.accessToken;
    return cachedToken;
}

export async function teardownTestServer() {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
        server = null;
    }
    if (mongoose.connection.readyState) {
        await mongoose.disconnect();
    }
}


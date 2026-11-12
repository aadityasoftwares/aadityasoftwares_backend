import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || "";
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "";
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "aadityasoftwares";
const publicUrl = process.env.MEDIA_BASE_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL || "https://media.aadityasoftwares.in";
const bucketIsPrivate = process.env.CLOUDFLARE_R2_BUCKET_IS_PRIVATE === "true";

export const MEDIA_BASE_URL = publicUrl.replace(/\/+$/, "");

export const cloudflareR2Client = new S3Client({
    region: "auto",
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

export const R2_CONFIG = {
    ACCOUNT_ID: accountId,
    ACCESS_KEY_ID: accessKeyId,
    SECRET_ACCESS_KEY: secretAccessKey,
    BUCKET_NAME: bucketName,
    PUBLIC_URL: publicUrl.replace(/\/$/, ""),
    BUCKET_IS_PRIVATE: bucketIsPrivate,
    PRIVATE_BUCKET_NAME:
        process.env.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME?.trim() || (bucketIsPrivate ? bucketName : ""),
    ENDPOINT: `https://${accountId}.r2.cloudflarestorage.com`,
} as const;


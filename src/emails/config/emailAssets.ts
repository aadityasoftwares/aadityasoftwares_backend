// Sticky Ji — Email Assets
import { MEDIA_BASE_URL } from "../../config/cloudflareR2.config.js";

export const emailAssets = {
    logo: {
        primary: `${MEDIA_BASE_URL}/logo/primary-logo.png`,
    },

    links: {
        website: "https://aadityasoftwares.in/mystickynotes",
        dashboard: "https://aadityasoftwares.in/mystickynotes",
        login: "https://aadityasoftwares.in/mystickynotes/login",
        signup: "https://aadityasoftwares.in/mystickynotes/signup",
        pricing: "https://aadityasoftwares.in/mystickynotes/pricing",
        support: "https://aadityasoftwares.in/mystickynotes/support",
    },

    actions: {
        verifyEmail: "https://aadityasoftwares.in/mystickynotes/verify-email",
        resetPassword: "https://aadityasoftwares.in/mystickynotes/reset-password",
        unsubscribe: "https://aadityasoftwares.in/mystickynotes/unsubscribe",
    },
} as const;

export type EmailAssets = typeof emailAssets;

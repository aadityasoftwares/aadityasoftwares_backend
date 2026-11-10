import { smtpSender, smtpTransporter } from "../../config/emailmailer.js";

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    replyTo?: string;
    attachments?: Array<{
        filename: string;
        content?: any;
        path?: string;
        contentType?: string;
    }>;
}

export const sendEmail = async ({ to, subject, html, replyTo, attachments }: SendEmailOptions) => {
    try {
        const info = await smtpTransporter.sendMail({
            from: smtpSender,
            to,
            subject,
            html,
            ...(replyTo ? { replyTo } : {}),
            ...(attachments && attachments.length > 0 ? { attachments } : {}),
        });

        return {
            messageId: info.messageId,
            accepted: info.accepted ?? [],
            rejected: info.rejected ?? [],
            response: info.response,
        };
    } catch (error) {
        console.error("SMTP email error:", error);

        if (error instanceof Error) {
            throw new Error(error.message);
        }

        throw new Error("Unable to send email.");
    }
};

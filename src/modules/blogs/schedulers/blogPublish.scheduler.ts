import cron from "node-cron";
import { BlogModel } from "../models/blog.model.js";
import { BlogStatus } from "../constants/blog.enums.js";
import { AuditLogService } from "../../auditlog/services/auditLog.service.js";
import { AppModule } from "../../../utils/enums/appModule.enums.js";
import { AuditLogAction } from "../../auditlog/constants/auditLog.enums.js";

let started = false;
let running = false;

export async function runScheduledBlogPublish(): Promise<{ publishedCount: number }> {
    const now = new Date();
    const scheduledBlogs = await BlogModel.find({
        status: BlogStatus.SCHEDULED,
        scheduledAt: { $lte: now },
    });

    if (scheduledBlogs.length === 0) {
        return { publishedCount: 0 };
    }

    const auditLogService = new AuditLogService();
    let publishedCount = 0;

    for (const blog of scheduledBlogs) {
        try {
            blog.status = BlogStatus.PUBLISHED;
            blog.publishedAt = blog.scheduledAt || now;
            await blog.save();
            publishedCount++;

            await auditLogService.log({
                module: AppModule.BLOG,
                action: AuditLogAction.STATUS_CHANGE,
                resourceId: String(blog._id),
                resourceName: blog.title,
                description: `Scheduled article "${blog.title}" published automatically by scheduler.`,
            });
        } catch (err) {
            console.error(`[BlogPublishScheduler] Failed to publish scheduled blog ${blog._id}:`, err);
        }
    }

    return { publishedCount };
}

export const startBlogPublishScheduler = (): void => {
    if (started) return;

    // Run every minute: * * * * *
    cron.schedule(
        "* * * * *",
        async () => {
            if (running) return;
            running = true;
            try {
                const result = await runScheduledBlogPublish();
                if (result.publishedCount > 0) {
                    console.log(`[BlogPublishScheduler] Published ${result.publishedCount} scheduled blog article(s).`);
                }
            } catch (error) {
                console.error("[BlogPublishScheduler] Error running scheduled publishing job:", error);
            } finally {
                running = false;
            }
        },
        { timezone: "UTC" },
    );

    started = true;
    console.log("[BlogPublishScheduler] Scheduler started (every minute UTC).");
};


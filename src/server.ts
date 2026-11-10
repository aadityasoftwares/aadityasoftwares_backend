import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { initializeDatabaseIfRequired } from "./database/initialization/database-initializer.js";
import { startMediaCleanupScheduler } from "./modules/media/schedulers/mediaCleanup.scheduler.js";

const PORT = process.env.PORT || 5050;

console.log("=== Aaditya Softwares Backend ===");
console.log("PORT:", PORT);
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("APP_URL:", process.env.APP_URL);
console.log("JWT_ACCESS_SECRET:", process.env.JWT_ACCESS_SECRET ? "Loaded ✅" : "Not Found ❌");

async function startServer() {
    try {
        await connectDatabase();
        await initializeDatabaseIfRequired();

        startMediaCleanupScheduler();

        app.listen(PORT, () => {
            console.log(`🚀 Aaditya Softwares Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed", error);
        process.exit(1);
    }
}

startServer();


import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { createCorsOptions } from "./config/cors.config.js";

import appRoutes from "./routes/app.routes.js";
import { errorMiddleware } from "./middlewares/error/error.middleware.js";
import { savePerformanceMiddleware } from "./utils/savePerformance.util.js";

const app = express();
app.use(savePerformanceMiddleware);

/**
 * Security
 */
app.use(helmet());
app.use(cookieParser());
app.use(cors(createCorsOptions()));

/**
 * Performance
 */
app.use(compression());

/**
 * Body parsing
 */
app.use(
    express.json({
        verify: (req: any, _res, buf) => {
            req.rawBody = buf;
        },
    }),
);
app.use(express.urlencoded({ extended: true }));

/**
 * Health check & Info
 */
app.get("/health", (_req, res) => {
    res.json({
        success: true,
        service: "Aaditya Softwares Backend",
        status: "healthy",
        timestamp: new Date().toISOString(),
    });
});

/**
 * API Routes
 */
app.use("/api/v1", appRoutes);

/**
 * Global Error Handler
 */
app.use(errorMiddleware);

export default app;


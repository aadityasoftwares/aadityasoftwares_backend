import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/errors/app.error.js";
import { ResponseUtil } from "../../utils/response.util.js";

export const errorMiddleware = (error: any, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json(ResponseUtil.error(error.message, error.code));
    }

    // Mongoose CastError (e.g. invalid ObjectId)
    if (error.name === "CastError") {
        return res.status(400).json(ResponseUtil.error(`Invalid ${error.path}: ${error.value}`, "INVALID_ID"));
    }

    // Mongoose ValidationError
    if (error.name === "ValidationError") {
        const messages = Object.values(error.errors || {}).map((e: any) => e.message);
        return res.status(400).json(ResponseUtil.validationError(messages.join(", ") || "Validation failed"));
    }

    // Mongo duplicate key error (code 11000)
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || "field";
        return res.status(409).json(ResponseUtil.error(`Duplicate value entered for ${field}.`, "DUPLICATE_KEY"));
    }

    console.error("Unhandled Application Error:", error);

    return res.status(500).json(ResponseUtil.error(error.message || "Internal server error.", "INTERNAL_SERVER_ERROR"));
};


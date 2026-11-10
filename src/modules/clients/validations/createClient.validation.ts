import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../utils/errors/app.error.js";
import { ClientMessages } from "../constants/client.messages.js";
import { ClientStatus } from "../constants/client.enums.js";

export const createClientValidation = (req: Request, res: Response, next: NextFunction) => {
    const { name, email, status } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
        throw new AppError(ClientMessages.NAME_REQUIRED, 400);
    }

    if (!email || typeof email !== "string" || !email.trim()) {
        throw new AppError(ClientMessages.EMAIL_REQUIRED, 400);
    }

    if (status && !Object.values(ClientStatus).includes(status)) {
        throw new AppError(ClientMessages.INVALID_STATUS, 400);
    }

    next();
};


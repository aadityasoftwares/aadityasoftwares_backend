import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../utils/errors/app.error.js";
import { ClientMessages } from "../constants/client.messages.js";
import { ClientStatus } from "../constants/client.enums.js";

export const updateClientValidation = (req: Request, res: Response, next: NextFunction) => {
    const { name, email, status } = req.body;

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
        throw new AppError("Client name cannot be empty.", 400);
    }

    if (email !== undefined && (typeof email !== "string" || !email.trim())) {
        throw new AppError("Client email cannot be empty.", 400);
    }

    if (status && !Object.values(ClientStatus).includes(status)) {
        throw new AppError(ClientMessages.INVALID_STATUS, 400);
    }

    next();
};


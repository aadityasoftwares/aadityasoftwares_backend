import type { Document, Types } from "mongoose";
import { PaymentMethod, PaymentStatus } from "../constants/payment.enums.js";

export interface IPayment {
    paymentNumber: string;
    invoiceId: Types.ObjectId;
    clientId: Types.ObjectId;
    amount: number;
    currencyId?: Types.ObjectId;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    transactionReference?: string;
    notes?: string;
    status: PaymentStatus;
    reversalReason?: string;
    reversedAt?: Date;
    reversedBy?: Types.ObjectId;
    recordedBy: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IPaymentDocument extends IPayment, Document {
    _id: Types.ObjectId;
}

export interface IPaymentFilter {
    page?: number;
    limit?: number;
    search?: string;
    invoiceId?: string;
    clientId?: string;
    status?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}


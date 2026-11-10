import mongoose, { Model, Schema } from "mongoose";
import type { IPaymentDocument } from "../interfaces/payment.interface.js";
import { PaymentMethod, PaymentStatus } from "../constants/payment.enums.js";

const PaymentSchema = new Schema<IPaymentDocument>(
    {
        paymentNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
        invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
        clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
        amount: { type: Number, required: true, min: 0.01 },
        currencyId: { type: Schema.Types.ObjectId, ref: "Currency", default: null },
        paymentDate: { type: Date, required: true, default: Date.now },
        paymentMethod: {
            type: String,
            enum: Object.values(PaymentMethod),
            default: PaymentMethod.BANK_TRANSFER,
        },
        transactionReference: { type: String, trim: true, default: "" },
        notes: { type: String, trim: true, default: "" },
        status: {
            type: String,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.COMPLETED,
            index: true,
        },
        reversalReason: { type: String, trim: true, default: null },
        reversedAt: { type: Date, default: null },
        reversedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true, versionKey: false },
);

PaymentSchema.index({ paymentNumber: 1 });
PaymentSchema.index({ invoiceId: 1, status: 1 });
PaymentSchema.index({ paymentDate: -1 });

export const PaymentModel: Model<IPaymentDocument> =
    (mongoose.models.Payment as Model<IPaymentDocument> | undefined) ??
    mongoose.model<IPaymentDocument>("Payment", PaymentSchema, "payments");


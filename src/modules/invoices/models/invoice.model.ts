import mongoose, { Model, Schema } from "mongoose";
import type { IInvoiceDocument } from "../interfaces/invoice.interface.js";
import { InvoiceStatus } from "../constants/invoice.enums.js";

const LineItemSchema = new Schema(
    {
        description: { type: String, required: true, trim: true },
        hsnSacCode: { type: String, trim: true, default: "" },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        unitRate: { type: Number, required: true, min: 0, default: 0 },
        grossAmount: { type: Number, required: true, default: 0 },
        discountAmount: { type: Number, default: 0 },
        taxableAmount: { type: Number, required: true, default: 0 },
        gstRate: { type: Number, default: 18 },
        cgstRate: { type: Number, default: 0 },
        cgstAmount: { type: Number, default: 0 },
        sgstRate: { type: Number, default: 0 },
        sgstAmount: { type: Number, default: 0 },
        igstRate: { type: Number, default: 0 },
        igstAmount: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true, default: 0 },
    },
    { _id: false },
);

const ClientSnapshotSchema = new Schema(
    {
        name: { type: String, required: true },
        companyName: { type: String, default: "" },
        email: { type: String, required: true },
        phone: { type: String, default: "" },
        gstin: { type: String, default: "" },
        pan: { type: String, default: "" },
        address: { type: String, default: "" },
        stateCode: { type: String, default: "" },
        countryCode: { type: String, default: "IN" },
    },
    { _id: false },
);

const InvoiceSchema = new Schema<IInvoiceDocument>(
    {
        invoiceNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
        quotationId: { type: Schema.Types.ObjectId, ref: "Quotation", default: null },
        clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
        clientSnapshot: { type: ClientSnapshotSchema, required: true },
        items: { type: [LineItemSchema], required: true, default: [] },
        currencyId: { type: Schema.Types.ObjectId, ref: "Currency", default: null },
        exchangeRate: { type: Number, default: 1, min: 0 },
        subTotal: { type: Number, required: true, default: 0 },
        totalDiscount: { type: Number, default: 0 },
        taxableAmount: { type: Number, required: true, default: 0 },
        cgstTotal: { type: Number, default: 0 },
        sgstTotal: { type: Number, default: 0 },
        igstTotal: { type: Number, default: 0 },
        grandTotal: { type: Number, required: true, default: 0 },
        paidAmount: { type: Number, default: 0, min: 0 },
        outstandingBalance: { type: Number, required: true, default: 0 },
        isIntraState: { type: Boolean, default: true },
        isExport: { type: Boolean, default: false },
        issueDate: { type: Date, required: true, default: Date.now },
        dueDate: { type: Date, required: true },
        paymentTerms: { type: String, trim: true, default: "" },
        notes: { type: String, trim: true, default: "" },
        status: {
            type: String,
            enum: Object.values(InvoiceStatus),
            default: InvoiceStatus.DRAFT,
            index: true,
        },
        cancellationReason: { type: String, trim: true, default: null },
        cancelledAt: { type: Date, default: null },
        cancelledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false },
);

InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ clientId: 1, status: 1 });
InvoiceSchema.index({ dueDate: 1 });

export const InvoiceModel: Model<IInvoiceDocument> =
    (mongoose.models.Invoice as Model<IInvoiceDocument> | undefined) ??
    mongoose.model<IInvoiceDocument>("Invoice", InvoiceSchema, "invoices");


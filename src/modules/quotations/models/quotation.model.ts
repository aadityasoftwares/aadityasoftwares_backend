import mongoose, { Model, Schema } from "mongoose";
import type { IQuotationDocument } from "../interfaces/quotation.interface.js";
import { QuotationStatus } from "../constants/quotation.enums.js";

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

const QuotationSchema = new Schema<IQuotationDocument>(
    {
        quotationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
        clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
        enquiryId: { type: Schema.Types.ObjectId, ref: "Enquiry", default: null },
        items: { type: [LineItemSchema], required: true, default: [] },
        currencyId: { type: Schema.Types.ObjectId, ref: "Currency", default: null },
        subTotal: { type: Number, required: true, default: 0 },
        totalDiscount: { type: Number, default: 0 },
        taxableAmount: { type: Number, required: true, default: 0 },
        cgstTotal: { type: Number, default: 0 },
        sgstTotal: { type: Number, default: 0 },
        igstTotal: { type: Number, default: 0 },
        grandTotal: { type: Number, required: true, default: 0 },
        isIntraState: { type: Boolean, default: true },
        isExport: { type: Boolean, default: false },
        validUntil: { type: Date, default: null },
        paymentTerms: { type: String, trim: true, default: "" },
        notes: { type: String, trim: true, default: "" },
        status: {
            type: String,
            enum: Object.values(QuotationStatus),
            default: QuotationStatus.DRAFT,
            index: true,
        },
        convertedInvoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", default: null },
        convertedAt: { type: Date, default: null },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false },
);

QuotationSchema.index({ quotationNumber: 1 });
QuotationSchema.index({ clientId: 1, status: 1 });

export const QuotationModel: Model<IQuotationDocument> =
    (mongoose.models.Quotation as Model<IQuotationDocument> | undefined) ??
    mongoose.model<IQuotationDocument>("Quotation", QuotationSchema, "quotations");


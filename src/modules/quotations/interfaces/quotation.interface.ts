import type { Document, Types } from "mongoose";
import { QuotationStatus } from "../constants/quotation.enums.js";
import type { ICalculatedGstItem } from "../../../utils/gst.util.js";

export interface IQuotation {
    quotationNumber: string;
    clientId: Types.ObjectId;
    enquiryId?: Types.ObjectId;
    items: ICalculatedGstItem[];
    currencyId?: Types.ObjectId;
    subTotal: number;
    totalDiscount: number;
    taxableAmount: number;
    cgstTotal: number;
    sgstTotal: number;
    igstTotal: number;
    grandTotal: number;
    isIntraState: boolean;
    isExport: boolean;
    validUntil?: Date;
    paymentTerms?: string;
    notes?: string;
    status: QuotationStatus;
    convertedInvoiceId?: Types.ObjectId;
    convertedAt?: Date;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    isDeleted?: boolean;
    deletedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IQuotationDocument extends IQuotation, Document {
    _id: Types.ObjectId;
}

export interface IQuotationFilter {
    page?: number;
    limit?: number;
    search?: string;
    status?: QuotationStatus;
    clientId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}


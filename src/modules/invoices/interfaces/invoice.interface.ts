import type { Document, Types } from "mongoose";
import { InvoiceStatus } from "../constants/invoice.enums.js";
import type { ICalculatedGstItem } from "../../../utils/gst.util.js";

export interface IClientSnapshot {
    name: string;
    companyName?: string;
    email: string;
    phone?: string;
    gstin?: string;
    pan?: string;
    address?: string;
    stateCode?: string;
    countryCode?: string;
}

export interface IInvoice {
    invoiceNumber: string;
    quotationId?: Types.ObjectId;
    clientId: Types.ObjectId;
    clientSnapshot: IClientSnapshot;
    items: ICalculatedGstItem[];
    currencyId?: Types.ObjectId;
    exchangeRate?: number;
    subTotal: number;
    totalDiscount: number;
    taxableAmount: number;
    cgstTotal: number;
    sgstTotal: number;
    igstTotal: number;
    grandTotal: number;
    paidAmount: number;
    outstandingBalance: number;
    isIntraState: boolean;
    isExport: boolean;
    issueDate: Date;
    dueDate: Date;
    paymentTerms?: string;
    notes?: string;
    status: InvoiceStatus;
    cancellationReason?: string;
    cancelledAt?: Date;
    cancelledBy?: Types.ObjectId;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    isDeleted?: boolean;
    deletedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IInvoiceDocument extends IInvoice, Document {
    _id: Types.ObjectId;
}

export interface IInvoiceFilter {
    page?: number;
    limit?: number;
    search?: string;
    status?: InvoiceStatus;
    clientId?: string;
    overdueOnly?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}


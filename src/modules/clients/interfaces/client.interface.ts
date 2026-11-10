import type { Document, Types } from "mongoose";
import { ClientStatus } from "../constants/client.enums.js";

export interface IAddress {
    street?: string;
    city?: string;
    state?: string;
    stateCode?: string;
    postalCode?: string;
    countryCode?: string;
}

export interface IClient {
    name: string;
    companyName?: string;
    email: string;
    phone?: string;
    alternatePhone?: string;
    website?: string;
    billingAddress?: IAddress;
    shippingAddress?: IAddress;
    gstin?: string;
    pan?: string;
    currencyId?: Types.ObjectId;
    countryId?: Types.ObjectId;
    status: ClientStatus;
    notes?: string;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    isDeleted?: boolean;
    deletedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IClientDocument extends IClient, Document {
    _id: Types.ObjectId;
}

export interface IClientFilter {
    page?: number;
    limit?: number;
    search?: string;
    status?: ClientStatus;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}


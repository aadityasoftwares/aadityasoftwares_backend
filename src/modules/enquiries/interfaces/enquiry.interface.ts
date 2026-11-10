import type { Document, Types } from "mongoose";
import { EnquiryPriority, EnquirySource, EnquiryStatus } from "../constants/enquiry.enums.js";

export interface IEnquiry {
    enquiryNumber: string;
    clientId?: Types.ObjectId;
    prospectName: string;
    prospectEmail: string;
    prospectPhone?: string;
    companyName?: string;
    projectTitle: string;
    projectRequirements: string;
    projectDescription?: string;
    technologies: string[];
    estimatedBudget?: number;
    currencyId?: Types.ObjectId;
    source: EnquirySource;
    assignedTo?: Types.ObjectId;
    priority: EnquiryPriority;
    status: EnquiryStatus;
    followUpDate?: Date;
    expectedClosingDate?: Date;
    internalNotes?: string;
    lostReason?: string;
    convertedClientId?: Types.ObjectId;
    convertedAt?: Date;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    isDeleted?: boolean;
    deletedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IEnquiryDocument extends IEnquiry, Document {
    _id: Types.ObjectId;
}

export interface IEnquiryFilter {
    page?: number;
    limit?: number;
    search?: string;
    status?: EnquiryStatus;
    priority?: EnquiryPriority;
    assignedTo?: string;
    source?: EnquirySource;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}


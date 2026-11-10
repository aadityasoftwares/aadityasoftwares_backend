import mongoose, { Document, Model, Schema, Types } from "mongoose";

export enum FollowUpType {
    CALL = "CALL",
    EMAIL = "EMAIL",
    MEETING = "MEETING",
    WHATSAPP = "WHATSAPP",
    NOTE = "NOTE",
}

export enum FollowUpStatus {
    SCHEDULED = "SCHEDULED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
}

export interface IEnquiryFollowUp {
    enquiryId: Types.ObjectId;
    followUpType: FollowUpType;
    summary: string;
    detailedNotes?: string;
    scheduledAt: Date;
    completedAt?: Date;
    status: FollowUpStatus;
    nextFollowUpDate?: Date;
    performedBy: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IEnquiryFollowUpDocument extends IEnquiryFollowUp, Document {
    _id: Types.ObjectId;
}

const EnquiryFollowUpSchema = new Schema<IEnquiryFollowUpDocument>(
    {
        enquiryId: { type: Schema.Types.ObjectId, ref: "Enquiry", required: true, index: true },
        followUpType: {
            type: String,
            enum: Object.values(FollowUpType),
            default: FollowUpType.CALL,
        },
        summary: { type: String, required: true, trim: true },
        detailedNotes: { type: String, trim: true, default: "" },
        scheduledAt: { type: Date, required: true, default: Date.now },
        completedAt: { type: Date, default: null },
        status: {
            type: String,
            enum: Object.values(FollowUpStatus),
            default: FollowUpStatus.COMPLETED,
        },
        nextFollowUpDate: { type: Date, default: null },
        performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true, versionKey: false },
);

export const EnquiryFollowUpModel: Model<IEnquiryFollowUpDocument> =
    (mongoose.models.EnquiryFollowUp as Model<IEnquiryFollowUpDocument> | undefined) ??
    mongoose.model<IEnquiryFollowUpDocument>("EnquiryFollowUp", EnquiryFollowUpSchema, "enquiry_follow_ups");


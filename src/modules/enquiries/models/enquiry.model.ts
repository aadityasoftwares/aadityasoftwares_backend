import mongoose, { Model, Schema } from "mongoose";
import type { IEnquiryDocument } from "../interfaces/enquiry.interface.js";
import { EnquiryPriority, EnquirySource, EnquiryStatus } from "../constants/enquiry.enums.js";

const EnquirySchema = new Schema<IEnquiryDocument>(
    {
        enquiryNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
        clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },
        prospectName: { type: String, required: true, trim: true },
        prospectEmail: { type: String, required: true, lowercase: true, trim: true },
        prospectPhone: { type: String, trim: true, default: "" },
        companyName: { type: String, trim: true, default: "" },
        projectTitle: { type: String, required: true, trim: true },
        projectRequirements: { type: String, required: true, trim: true },
        projectDescription: { type: String, trim: true, default: "" },
        technologies: { type: [String], default: [] },
        estimatedBudget: { type: Number, default: 0, min: 0 },
        currencyId: { type: Schema.Types.ObjectId, ref: "Currency", default: null },
        source: {
            type: String,
            enum: Object.values(EnquirySource),
            default: EnquirySource.WEBSITE,
        },
        assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
        priority: {
            type: String,
            enum: Object.values(EnquiryPriority),
            default: EnquiryPriority.MEDIUM,
        },
        status: {
            type: String,
            enum: Object.values(EnquiryStatus),
            default: EnquiryStatus.NEW,
            index: true,
        },
        followUpDate: { type: Date, default: null },
        expectedClosingDate: { type: Date, default: null },
        internalNotes: { type: String, trim: true, default: "" },
        lostReason: { type: String, trim: true, default: "" },
        convertedClientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },
        convertedAt: { type: Date, default: null },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false },
);

EnquirySchema.index({ enquiryNumber: 1 });
EnquirySchema.index({ prospectEmail: 1 });
EnquirySchema.index({ assignedTo: 1, status: 1 });
EnquirySchema.index({ followUpDate: 1 });

export const EnquiryModel: Model<IEnquiryDocument> =
    (mongoose.models.Enquiry as Model<IEnquiryDocument> | undefined) ??
    mongoose.model<IEnquiryDocument>("Enquiry", EnquirySchema, "enquiries");


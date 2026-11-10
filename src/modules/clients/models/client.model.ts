import mongoose, { Model, Schema } from "mongoose";
import type { IClientDocument } from "../interfaces/client.interface.js";
import { ClientStatus } from "../constants/client.enums.js";

const AddressSchema = new Schema(
    {
        street: { type: String, trim: true, default: "" },
        city: { type: String, trim: true, default: "" },
        state: { type: String, trim: true, default: "" },
        stateCode: { type: String, trim: true, default: "" },
        postalCode: { type: String, trim: true, default: "" },
        countryCode: { type: String, trim: true, default: "IN" },
    },
    { _id: false },
);

const ClientSchema = new Schema<IClientDocument>(
    {
        name: { type: String, required: true, trim: true },
        companyName: { type: String, trim: true, default: "" },
        email: { type: String, required: true, lowercase: true, trim: true },
        phone: { type: String, trim: true, default: "" },
        alternatePhone: { type: String, trim: true, default: "" },
        website: { type: String, trim: true, default: "" },
        billingAddress: { type: AddressSchema, default: () => ({}) },
        shippingAddress: { type: AddressSchema, default: () => ({}) },
        gstin: { type: String, uppercase: true, trim: true, default: null },
        pan: { type: String, uppercase: true, trim: true, default: null },
        currencyId: { type: Schema.Types.ObjectId, ref: "Currency", default: null },
        countryId: { type: Schema.Types.ObjectId, ref: "Country", default: null },
        status: {
            type: String,
            enum: Object.values(ClientStatus),
            default: ClientStatus.ACTIVE,
            index: true,
        },
        notes: { type: String, trim: true, default: "" },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false },
);

ClientSchema.index({ email: 1 });
ClientSchema.index({ gstin: 1 });
ClientSchema.index({ name: "text", companyName: "text", email: "text" });

export const ClientModel: Model<IClientDocument> =
    (mongoose.models.Client as Model<IClientDocument> | undefined) ??
    mongoose.model<IClientDocument>("Client", ClientSchema, "clients");


import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICounter {
    key: string;
    sequence: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICounterDocument extends ICounter, Document {
    _id: mongoose.Types.ObjectId;
}

const CounterSchema = new Schema<ICounterDocument>(
    {
        key: { type: String, required: true, unique: true, trim: true },
        sequence: { type: Number, required: true, default: 0, min: 0 },
    },
    { timestamps: true, versionKey: false },
);

export const CounterModel: Model<ICounterDocument> =
    (mongoose.models.Counter as Model<ICounterDocument> | undefined) ??
    mongoose.model<ICounterDocument>("Counter", CounterSchema, "counters");


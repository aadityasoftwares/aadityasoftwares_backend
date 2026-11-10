import mongoose, { Document, Model, Schema, Types } from "mongoose";

export enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT",
}

export enum TaskStatus {
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    REVIEW = "REVIEW",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
}

export interface ITask {
    title: string;
    description?: string;
    assignedTo?: Types.ObjectId;
    relatedClient?: Types.ObjectId;
    relatedEnquiry?: Types.ObjectId;
    relatedInvoice?: Types.ObjectId;
    dueDate?: Date;
    completedAt?: Date;
    priority: TaskPriority;
    status: TaskStatus;
    internalNotes?: string;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    isDeleted?: boolean;
    deletedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ITaskDocument extends ITask, Document {
    _id: Types.ObjectId;
}

const TaskSchema = new Schema<ITaskDocument>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: "" },
        assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
        relatedClient: { type: Schema.Types.ObjectId, ref: "Client", default: null },
        relatedEnquiry: { type: Schema.Types.ObjectId, ref: "Enquiry", default: null },
        relatedInvoice: { type: Schema.Types.ObjectId, ref: "Invoice", default: null },
        dueDate: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        priority: {
            type: String,
            enum: Object.values(TaskPriority),
            default: TaskPriority.MEDIUM,
        },
        status: {
            type: String,
            enum: Object.values(TaskStatus),
            default: TaskStatus.TODO,
            index: true,
        },
        internalNotes: { type: String, trim: true, default: "" },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false },
);

TaskSchema.index({ dueDate: 1 });

export const TaskModel: Model<ITaskDocument> =
    (mongoose.models.Task as Model<ITaskDocument> | undefined) ??
    mongoose.model<ITaskDocument>("Task", TaskSchema, "tasks");


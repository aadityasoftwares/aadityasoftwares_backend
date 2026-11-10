import mongoose, { Document, Model, Schema, Types } from "mongoose";

export enum ExpenseCategory {
    OFFICE_RENT = "OFFICE_RENT",
    SALARY_PAYROLL = "SALARY_PAYROLL",
    SOFTWARE_LICENSE = "SOFTWARE_LICENSE",
    INFRASTRUCTURE_HOSTING = "INFRASTRUCTURE_HOSTING",
    MARKETING = "MARKETING",
    TRAVEL = "TRAVEL",
    OFFICE_SUPPLIES = "OFFICE_SUPPLIES",
    PROFESSIONAL_FEES = "PROFESSIONAL_FEES",
    MISCELLANEOUS = "MISCELLANEOUS",
}

export enum ExpenseStatus {
    PENDING_APPROVAL = "PENDING_APPROVAL",
    APPROVED = "APPROVED",
    PAID = "PAID",
    REJECTED = "REJECTED",
}

export interface IExpense {
    expenseNumber: string;
    title: string;
    category: ExpenseCategory;
    amount: number;
    currencyId?: Types.ObjectId;
    expenseDate: Date;
    paymentMethod: string;
    vendorName?: string;
    receiptMediaId?: Types.ObjectId;
    notes?: string;
    status: ExpenseStatus;
    recordedBy: Types.ObjectId;
    isDeleted?: boolean;
    deletedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IExpenseDocument extends IExpense, Document {
    _id: Types.ObjectId;
}

const ExpenseSchema = new Schema<IExpenseDocument>(
    {
        expenseNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
        title: { type: String, required: true, trim: true },
        category: {
            type: String,
            enum: Object.values(ExpenseCategory),
            required: true,
            default: ExpenseCategory.MISCELLANEOUS,
            index: true,
        },
        amount: { type: Number, required: true, min: 0.01 },
        currencyId: { type: Schema.Types.ObjectId, ref: "Currency", default: null },
        expenseDate: { type: Date, required: true, default: Date.now, index: true },
        paymentMethod: { type: String, required: true, default: "BANK_TRANSFER" },
        vendorName: { type: String, trim: true, default: "" },
        receiptMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
        notes: { type: String, trim: true, default: "" },
        status: {
            type: String,
            enum: Object.values(ExpenseStatus),
            default: ExpenseStatus.PAID,
            index: true,
        },
        recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false },
);

ExpenseSchema.index({ expenseNumber: 1 });

export const ExpenseModel: Model<IExpenseDocument> =
    (mongoose.models.Expense as Model<IExpenseDocument> | undefined) ??
    mongoose.model<IExpenseDocument>("Expense", ExpenseSchema, "expenses");


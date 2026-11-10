import { Types } from "mongoose";
import { PaymentModel } from "../models/payment.model.js";
import type { IPayment, IPaymentDocument, IPaymentFilter } from "../interfaces/payment.interface.js";
import { getPagination, paginationMeta } from "../../../utils/pagination.util.js";

export class PaymentRepository {
    async create(data: Partial<IPayment>): Promise<IPaymentDocument> {
        return PaymentModel.create(data);
    }

    async findById(id: string): Promise<IPaymentDocument | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return PaymentModel.findById(id)
            .populate("clientId", "name companyName email")
            .populate("invoiceId", "invoiceNumber grandTotal paidAmount outstandingBalance status")
            .populate("recordedBy", "email")
            .populate("currencyId", "name code symbol")
            .exec();
    }

    async findByInvoiceId(invoiceId: string): Promise<IPaymentDocument[]> {
        if (!Types.ObjectId.isValid(invoiceId)) return [];
        return PaymentModel.find({ invoiceId: new Types.ObjectId(invoiceId) })
            .populate("recordedBy", "email")
            .sort({ paymentDate: -1 })
            .exec();
    }

    async findAll(filter: IPaymentFilter = {}) {
        const { page = 1, limit = 10, search, invoiceId, clientId, status, paymentMethod, sortBy = "paymentDate", sortOrder = "desc" } = filter;
        const { skip, limit: validatedLimit } = getPagination(page, limit);

        const query: Record<string, any> = {};

        if (status) query.status = status;
        if (paymentMethod) query.paymentMethod = paymentMethod;
        if (invoiceId && Types.ObjectId.isValid(invoiceId)) query.invoiceId = new Types.ObjectId(invoiceId);
        if (clientId && Types.ObjectId.isValid(clientId)) query.clientId = new Types.ObjectId(clientId);

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [{ paymentNumber: regex }, { transactionReference: regex }, { notes: regex }];
        }

        const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const [items, total] = await Promise.all([
            PaymentModel.find(query)
                .populate("clientId", "name companyName")
                .populate("invoiceId", "invoiceNumber")
                .populate("recordedBy", "email")
                .populate("currencyId", "name code symbol")
                .sort(sortOptions)
                .skip(skip)
                .limit(validatedLimit)
                .lean()
                .exec(),
            PaymentModel.countDocuments(query).exec(),
        ]);

        return {
            items,
            meta: paginationMeta(page, validatedLimit, total),
        };
    }
}


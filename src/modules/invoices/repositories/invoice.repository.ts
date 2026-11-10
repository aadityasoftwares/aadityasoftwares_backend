import { Types } from "mongoose";
import { InvoiceModel } from "../models/invoice.model.js";
import type { IInvoice, IInvoiceDocument, IInvoiceFilter } from "../interfaces/invoice.interface.js";
import { getPagination, paginationMeta } from "../../../utils/pagination.util.js";
import { InvoiceStatus } from "../constants/invoice.enums.js";

export class InvoiceRepository {
    async create(data: Partial<IInvoice>): Promise<IInvoiceDocument> {
        return InvoiceModel.create(data);
    }

    async findById(id: string): Promise<IInvoiceDocument | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return InvoiceModel.findOne({ _id: new Types.ObjectId(id), isDeleted: { $ne: true } })
            .populate("clientId", "name companyName email phone gstin")
            .populate("quotationId", "quotationNumber")
            .populate("currencyId", "name code symbol")
            .exec();
    }

    async findByNumber(invoiceNumber: string): Promise<IInvoiceDocument | null> {
        return InvoiceModel.findOne({ invoiceNumber: invoiceNumber.toUpperCase().trim(), isDeleted: { $ne: true } }).exec();
    }

    async update(id: string, data: Partial<IInvoice>): Promise<IInvoiceDocument | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return InvoiceModel.findOneAndUpdate(
            { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
            { $set: data },
            { new: true },
        ).exec();
    }

    async softDelete(id: string, userId?: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(id)) return false;
        const res = await InvoiceModel.updateOne(
            { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
            { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId ? new Types.ObjectId(userId) : null } },
        ).exec();
        return res.modifiedCount > 0;
    }

    async findAll(filter: IInvoiceFilter = {}) {
        const { page = 1, limit = 10, search, status, clientId, overdueOnly, sortBy = "createdAt", sortOrder = "desc" } = filter;
        const { skip, limit: validatedLimit } = getPagination(page, limit);

        const query: Record<string, any> = { isDeleted: { $ne: true } };

        if (status) query.status = status;
        if (clientId && Types.ObjectId.isValid(clientId)) query.clientId = new Types.ObjectId(clientId);

        if (overdueOnly) {
            query.dueDate = { $lt: new Date() };
            query.status = { $in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] };
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [
                { invoiceNumber: regex },
                { "clientSnapshot.name": regex },
                { "clientSnapshot.companyName": regex },
                { notes: regex },
            ];
        }

        const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const [items, total] = await Promise.all([
            InvoiceModel.find(query)
                .populate("clientId", "name companyName")
                .populate("currencyId", "name code symbol")
                .sort(sortOptions)
                .skip(skip)
                .limit(validatedLimit)
                .lean()
                .exec(),
            InvoiceModel.countDocuments(query).exec(),
        ]);

        return {
            items,
            meta: paginationMeta(page, validatedLimit, total),
        };
    }
}


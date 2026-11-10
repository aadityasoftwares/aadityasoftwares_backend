import { Types } from "mongoose";
import { QuotationModel } from "../models/quotation.model.js";
import type { IQuotation, IQuotationDocument, IQuotationFilter } from "../interfaces/quotation.interface.js";
import { getPagination, paginationMeta } from "../../../utils/pagination.util.js";

export class QuotationRepository {
    async create(data: Partial<IQuotation>): Promise<IQuotationDocument> {
        return QuotationModel.create(data);
    }

    async findById(id: string): Promise<IQuotationDocument | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return QuotationModel.findOne({ _id: new Types.ObjectId(id), isDeleted: { $ne: true } })
            .populate("clientId", "name companyName email phone gstin billingAddress")
            .populate("enquiryId", "enquiryNumber projectTitle")
            .populate("currencyId", "name code symbol")
            .populate("convertedInvoiceId", "invoiceNumber status")
            .exec();
    }

    async findByNumber(quotationNumber: string): Promise<IQuotationDocument | null> {
        return QuotationModel.findOne({ quotationNumber: quotationNumber.toUpperCase().trim(), isDeleted: { $ne: true } }).exec();
    }

    async update(id: string, data: Partial<IQuotation>): Promise<IQuotationDocument | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return QuotationModel.findOneAndUpdate(
            { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
            { $set: data },
            { new: true },
        ).exec();
    }

    async softDelete(id: string, userId?: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(id)) return false;
        const res = await QuotationModel.updateOne(
            { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
            { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId ? new Types.ObjectId(userId) : null } },
        ).exec();
        return res.modifiedCount > 0;
    }

    async findAll(filter: IQuotationFilter = {}) {
        const { page = 1, limit = 10, search, status, clientId, sortBy = "createdAt", sortOrder = "desc" } = filter;
        const { skip, limit: validatedLimit } = getPagination(page, limit);

        const query: Record<string, any> = { isDeleted: { $ne: true } };

        if (status) query.status = status;
        if (clientId && Types.ObjectId.isValid(clientId)) query.clientId = new Types.ObjectId(clientId);

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [{ quotationNumber: regex }, { notes: regex }];
        }

        const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const [items, total] = await Promise.all([
            QuotationModel.find(query)
                .populate("clientId", "name companyName")
                .populate("currencyId", "name code symbol")
                .sort(sortOptions)
                .skip(skip)
                .limit(validatedLimit)
                .lean()
                .exec(),
            QuotationModel.countDocuments(query).exec(),
        ]);

        return {
            items,
            meta: paginationMeta(page, validatedLimit, total),
        };
    }
}


import { Types } from "mongoose";
import { EnquiryModel } from "../models/enquiry.model.js";
import type { IEnquiry, IEnquiryDocument, IEnquiryFilter } from "../interfaces/enquiry.interface.js";
import { getPagination, paginationMeta } from "../../../utils/pagination.util.js";

export class EnquiryRepository {
    async create(data: Partial<IEnquiry>): Promise<IEnquiryDocument> {
        return EnquiryModel.create(data);
    }

    async findById(id: string): Promise<IEnquiryDocument | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return EnquiryModel.findOne({ _id: new Types.ObjectId(id), isDeleted: { $ne: true } })
            .populate("clientId", "name companyName email phone gstin")
            .populate("assignedTo", "email")
            .populate("currencyId", "name code symbol")
            .populate("convertedClientId", "name companyName email")
            .exec();
    }

    async findByNumber(enquiryNumber: string): Promise<IEnquiryDocument | null> {
        return EnquiryModel.findOne({ enquiryNumber: enquiryNumber.toUpperCase().trim(), isDeleted: { $ne: true } }).exec();
    }

    async update(id: string, data: Partial<IEnquiry>): Promise<IEnquiryDocument | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return EnquiryModel.findOneAndUpdate(
            { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
            { $set: data },
            { new: true },
        ).exec();
    }

    async softDelete(id: string, userId?: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(id)) return false;
        const res = await EnquiryModel.updateOne(
            { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
            { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId ? new Types.ObjectId(userId) : null } },
        ).exec();
        return res.modifiedCount > 0;
    }

    async findAll(filter: IEnquiryFilter = {}) {
        const { page = 1, limit = 10, search, status, priority, assignedTo, source, sortBy = "createdAt", sortOrder = "desc" } = filter;
        const { skip, limit: validatedLimit } = getPagination(page, limit);

        const query: Record<string, any> = { isDeleted: { $ne: true } };

        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (source) query.source = source;
        if (assignedTo && Types.ObjectId.isValid(assignedTo)) query.assignedTo = new Types.ObjectId(assignedTo);

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [
                { enquiryNumber: regex },
                { prospectName: regex },
                { prospectEmail: regex },
                { companyName: regex },
                { projectTitle: regex },
            ];
        }

        const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const [items, total] = await Promise.all([
            EnquiryModel.find(query)
                .populate("clientId", "name companyName")
                .populate("assignedTo", "email")
                .populate("currencyId", "name code symbol")
                .sort(sortOptions)
                .skip(skip)
                .limit(validatedLimit)
                .lean()
                .exec(),
            EnquiryModel.countDocuments(query).exec(),
        ]);

        return {
            items,
            meta: paginationMeta(page, validatedLimit, total),
        };
    }
}


import { Types } from "mongoose";
import { ClientModel } from "../models/client.model.js";
import type { IClient, IClientDocument, IClientFilter } from "../interfaces/client.interface.js";
import { getPagination, paginationMeta } from "../../../utils/pagination.util.js";

export class ClientRepository {
    async create(data: Partial<IClient>): Promise<IClientDocument> {
        return ClientModel.create(data);
    }

    async findById(id: string): Promise<IClientDocument | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return ClientModel.findOne({ _id: new Types.ObjectId(id), isDeleted: { $ne: true } })
            .populate("countryId", "name code")
            .populate("currencyId", "name code symbol")
            .exec();
    }

    async findByEmail(email: string): Promise<IClientDocument | null> {
        return ClientModel.findOne({ email: email.toLowerCase().trim(), isDeleted: { $ne: true } }).exec();
    }

    async findByGstin(gstin: string): Promise<IClientDocument | null> {
        return ClientModel.findOne({ gstin: gstin.toUpperCase().trim(), isDeleted: { $ne: true } }).exec();
    }

    async update(id: string, data: Partial<IClient>): Promise<IClientDocument | null> {
        if (!Types.ObjectId.isValid(id)) return null;
        return ClientModel.findOneAndUpdate(
            { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
            { $set: data },
            { new: true },
        ).exec();
    }

    async softDelete(id: string, userId?: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(id)) return false;
        const res = await ClientModel.updateOne(
            { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
            { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId ? new Types.ObjectId(userId) : null } },
        ).exec();
        return res.modifiedCount > 0;
    }

    async findAll(filter: IClientFilter = {}) {
        const { page = 1, limit = 10, search, status, sortBy = "createdAt", sortOrder = "desc" } = filter;
        const { skip, limit: validatedLimit } = getPagination(page, limit);

        const query: Record<string, any> = { isDeleted: { $ne: true } };

        if (status) {
            query.status = status;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [{ name: regex }, { companyName: regex }, { email: regex }, { phone: regex }, { gstin: regex }];
        }

        const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const [items, total] = await Promise.all([
            ClientModel.find(query)
                .populate("countryId", "name code")
                .populate("currencyId", "name code symbol")
                .sort(sortOptions)
                .skip(skip)
                .limit(validatedLimit)
                .lean()
                .exec(),
            ClientModel.countDocuments(query).exec(),
        ]);

        return {
            items,
            meta: paginationMeta(page, validatedLimit, total),
        };
    }
}


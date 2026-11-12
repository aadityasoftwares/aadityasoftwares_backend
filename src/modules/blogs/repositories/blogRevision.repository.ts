import { Types } from "mongoose";
import { BlogRevisionModel } from "../models/blogRevision.model.js";
import type { IBlogRevision } from "../interfaces/blog.interface.js";

export class BlogRevisionRepository {
    async create(data: Partial<IBlogRevision>) {
        return BlogRevisionModel.create(data);
    }

    async findLatestVersion(blogId: string): Promise<number> {
        if (!Types.ObjectId.isValid(blogId)) return 0;
        const latest = await BlogRevisionModel.findOne({ blogId: new Types.ObjectId(blogId) })
            .sort({ version: -1 })
            .select("version")
            .lean()
            .exec();
        return latest ? latest.version : 0;
    }

    async findByBlogId(blogId: string, limit = 20) {
        if (!Types.ObjectId.isValid(blogId)) return [];
        return BlogRevisionModel.find({ blogId: new Types.ObjectId(blogId) })
            .populate("createdBy", "email")
            .sort({ version: -1 })
            .limit(limit)
            .lean()
            .exec();
    }

    async findById(id: string) {
        if (!Types.ObjectId.isValid(id)) return null;
        return BlogRevisionModel.findById(id).populate("createdBy", "email").lean().exec();
    }
}


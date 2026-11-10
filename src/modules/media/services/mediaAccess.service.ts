import { Types } from "mongoose";
import { MediaResourceType } from "../constants/media.enums.js";
import type { IMedia } from "../interfaces/media.interface.js";
import type { MediaStorageScope } from "../storage/storageKey.builder.js";
import { AppError } from "../../../utils/errors/app.error.js";
import { PermissionAction } from "../../permissions/constants/permission.enums.js";

export class MediaAccessService {
    async resolve(
        userId: string,
        type?: MediaResourceType | null,
        id?: unknown,
        action = PermissionAction.READ,
    ): Promise<MediaStorageScope> {
        if (!Types.ObjectId.isValid(userId)) throw new AppError("Invalid user ID.", 400);
        return {
            accountId: userId,
            tenantId: userId,
        };
    }

    async assertMedia(media: IMedia, userId: string, action = PermissionAction.READ) {
        if (!Types.ObjectId.isValid(userId)) throw new AppError("Invalid user ID.", 400);
        return { accountId: userId, tenantId: userId };
    }
}

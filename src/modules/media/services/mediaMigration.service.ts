import type { IMedia } from "../interfaces/media.interface.js";

export async function resolveLegacyMediaOwnership(media: IMedia) {
    return { tenantId: null, workspaceId: null, storageKeyVersion: media.storageKeyVersion ?? 1 };
}

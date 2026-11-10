export const PAGINATION_DEFAULTS = { page: 1, limit: 10, maxLimit: 100 } as const;

export function getPagination(page: number = PAGINATION_DEFAULTS.page, limit: number = PAGINATION_DEFAULTS.limit) {
    const validPage = Math.max(1, Number(page) || 1);
    const validLimit = Math.min(PAGINATION_DEFAULTS.maxLimit, Math.max(1, Number(limit) || PAGINATION_DEFAULTS.limit));
    const skip = (validPage - 1) * validLimit;
    if (!Number.isSafeInteger(skip)) {
        throw new RangeError("Pagination offset exceeds the supported range.");
    }
    return { skip, limit: validLimit, page: validPage };
}

export function paginationMeta(page: number, limit: number, total: number) {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / (limit || 1)) || 1,
    };
}


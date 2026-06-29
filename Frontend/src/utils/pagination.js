export const createPagination = (items = [], page = 1, limit = 5) => {
    const total = items.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
    const start = (safePage - 1) * limit;

    return {
        items: items.slice(start, start + limit),
        pagination: {
            page: safePage,
            limit,
            total,
            totalPages
        }
    };
};

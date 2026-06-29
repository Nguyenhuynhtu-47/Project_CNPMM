const PaginationControls = ({ pagination, onPageChange, onLimitChange, itemLabel = 'items', pageSizeOptions = [5, 10, 20, 50] }) => {
    const page = Number(pagination?.page || 1);
    const limit = Number(pagination?.limit || pageSizeOptions[0]);
    const total = Number(pagination?.total || 0);
    const totalPages = Math.max(Number(pagination?.totalPages || 1), 1);

    return (
        <div className="pagination-controls">
            <small className="text-muted">
                Page {page} of {totalPages} - {total} {itemLabel}
            </small>
            <div className="d-flex flex-wrap align-items-center gap-2">
                {onLimitChange && (
                    <select className="form-select form-select-sm" value={limit} onChange={(event) => onLimitChange(Number(event.target.value))} aria-label={`${itemLabel} per page`}>
                        {pageSizeOptions.map((option) => (
                            <option key={option} value={option}>
                                {option} / page
                            </option>
                        ))}
                    </select>
                )}
                <button className="btn btn-sm btn-outline-secondary" type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                    Previous
                </button>
                <button className="btn btn-sm btn-outline-secondary" type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                    Next
                </button>
            </div>
        </div>
    );
};

export default PaginationControls;

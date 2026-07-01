const ENROLLMENT_STATUS_LABELS = {
    WAITING_CLASS: 'Waiting for class',
    ASSIGNED_CLASS: 'Ready to learn',
    LEARNING: 'Learning',
    COMPLETED: 'Completed by teacher',
    CANCELLED: 'Cancelled'
};

export const getEnrollmentStatusLabel = (status) => ENROLLMENT_STATUS_LABELS[status] || status || '-';

export const getEnrollmentStatusBadgeClass = (status) => {
    if (status === 'COMPLETED') return 'bg-success-subtle text-success';
    if (status === 'WAITING_CLASS') return 'bg-warning-subtle text-warning';
    if (status === 'CANCELLED') return 'bg-danger-subtle text-danger';
    return 'bg-primary-subtle text-primary';
};

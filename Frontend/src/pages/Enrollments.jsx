import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CourseImage from '../components/CourseImage';
import PaginationControls from '../components/PaginationControls';
import { getEnrollments } from '../services/enrollment';
import { getEnrollmentStatusBadgeClass, getEnrollmentStatusLabel } from '../utils/enrollmentStatus';
import { createPagination } from '../utils/pagination';

const Enrollments = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { items: visibleEnrollments, pagination } = createPagination(enrollments, page, limit);

    useEffect(() => {
        const loadEnrollments = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getEnrollments();
                setEnrollments(response.data.enrollments);
            } catch {
                setError('Cannot load enrollment history.');
            } finally {
                setLoading(false);
            }
        };

        loadEnrollments();
    }, []);

    return (
        <div className="container-fluid px-0 py-3">
            {/* Header Block */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 p-4 bg-white rounded-4 border">
                <div>
                    <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1.5 mb-2 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>My Enrollments</span>
                    <h2 className="fw-bold mb-1 text-dark">Track course and class assignments</h2>
                    <p className="text-muted mb-0 small">Review the courses you enrolled in and class assignment status.</p>
                </div>
            </div>

            {error && <div className="alert alert-danger py-2.5 mb-4">{error}</div>}

            {loading ? (
                <div className="text-center text-muted fw-semibold py-5">Loading enrollments...</div>
            ) : (
                <div className="row g-4">
                    {enrollments.length === 0 ? (
                        <div className="col-12">
                            <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                                <div className="bg-light p-3 rounded-circle mb-3 d-inline-block mx-auto" style={{ width: 'fit-content' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                        <path d="M6 6h10M6 10h10" />
                                    </svg>
                                </div>
                                <h5 className="fw-bold text-dark mb-1">No enrolled courses</h5>
                                <p className="text-muted small px-md-5 mb-4">You have not enrolled in any course yet. Explore our list of courses to get started.</p>
                                <Link className="btn btn-primary px-4 py-2.5 rounded-3 fw-bold auth-primary-btn" to="/courses">Browse courses</Link>
                            </div>
                        </div>
                    ) : (
                        visibleEnrollments.map((enrollment) => (
                                <div className="col-12" key={enrollment._id}>
                                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                        <div className="row g-0">
                                            <div className="col-md-3 position-relative" style={{ minHeight: '160px' }}>
                                                <CourseImage course={enrollment.course} className="w-100 h-100 position-absolute start-0 top-0" style={{ objectFit: 'cover' }} />
                                            </div>
                                            <div className="col-md-9 p-4 d-flex flex-column justify-content-between">
                                                <div>
                                                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                                                        <h5 className="fw-bold text-dark mb-0">{enrollment.course?.title}</h5>
                                                        <div className="d-flex gap-2">
                                                            <span className={`badge px-2.5 py-1.5 rounded-2 fw-semibold ${getEnrollmentStatusBadgeClass(enrollment.status)}`}>
                                                                {getEnrollmentStatusLabel(enrollment.status)}
                                                            </span>
                                                            {enrollment.class ? (
                                                                <span className="badge bg-secondary-subtle text-secondary px-2.5 py-1.5 rounded-2 font-monospace fw-bold">
                                                                    Class: {enrollment.class.code || enrollment.class.name}
                                                                </span>
                                                            ) : (
                                                                <span className="badge bg-warning-subtle text-warning px-2.5 py-1.5 rounded-2 fw-semibold">
                                                                    Waiting for Class
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-muted small mb-3">Review lectures, finish assignments, and wait for teacher completion approval.</p>
                                                </div>
                                                <div>
                                                    {enrollment.completedAt && (
                                                        <p className="text-success small mb-3 fw-semibold">
                                                            Completed at: {new Date(enrollment.completedAt).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    )}

                                                    <div className="row align-items-center g-3">
                                                        <div className="col-sm-8">
                                                            <span className={`badge px-3 py-2 rounded-3 fw-semibold ${getEnrollmentStatusBadgeClass(enrollment.status)}`}>
                                                                {getEnrollmentStatusLabel(enrollment.status)}
                                                            </span>
                                                        </div>
                                                        <div className="col-sm-4 d-flex justify-content-sm-end">
                                                            <Link className="btn btn-primary px-4 py-2 rounded-3 fw-bold auth-primary-btn w-100 text-center" to="/my-learning">
                                                                Study
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                        ))
                    )}
                </div>
            )}
            {!loading && enrollments.length > 0 && (
                <div className="mt-4">
                    <PaginationControls
                        pagination={pagination}
                        onPageChange={setPage}
                        onLimitChange={(nextLimit) => {
                            setLimit(nextLimit);
                            setPage(1);
                        }}
                        itemLabel="enrollments"
                    />
                </div>
            )}
        </div>
    );
};

export default Enrollments;

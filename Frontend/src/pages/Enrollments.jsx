import { useEffect, useState } from 'react';
import CourseImage from '../components/CourseImage';
import PaginationControls from '../components/PaginationControls';
import { getEnrollments } from '../services/enrollment';
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
        <div className="enrollments-page">
            <section className="section-block">
                <div className="section-heading">
                    <div>
                        <span className="eyebrow">My enrollments</span>
                        <h2>Track course and class assignments</h2>
                    </div>
                    <p>Review the courses you enrolled in and class assignment status.</p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {loading ? (
                    <div>Loading enrollments...</div>
                ) : (
                    <div className="row gy-4">
                        {enrollments.length === 0 ? (
                            <div className="alert alert-secondary">You have not enrolled in any course yet.</div>
                        ) : (
                            visibleEnrollments.map((enrollment) => (
                                <div className="col-12" key={enrollment._id}>
                                    <div className="card list-card">
                                        <CourseImage course={enrollment.course} className="list-card__image" />
                                        <div className="card-body">
                                            <h5 className="card-title">{enrollment.course?.title}</h5>
                                            <p className="card-text">Status: {enrollment.status}</p>
                                            <p className="card-text">Progress: {enrollment.progress}%</p>
                                            {enrollment.class ? (
                                                <p className="card-text">Class: {enrollment.class.code || enrollment.class.name}</p>
                                            ) : (
                                                <p className="card-text text-muted">Waiting for class assignment</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                {!loading && enrollments.length > 0 && (
                    <PaginationControls
                        pagination={pagination}
                        onPageChange={setPage}
                        onLimitChange={(nextLimit) => {
                            setLimit(nextLimit);
                            setPage(1);
                        }}
                        itemLabel="enrollments"
                    />
                )}
            </section>
        </div>
    );
};

export default Enrollments;

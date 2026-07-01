import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCourseById } from '../services/course';
import { enrollInCourse } from '../services/enrollment';
import { getCourseReviews } from '../services/review';
import CourseImage from '../components/CourseImage';

const CourseDetail = () => {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsError, setReviewsError] = useState(null);

    useEffect(() => {
        const loadCourse = async () => {
            setLoading(true);
            setError(null);
            try {
                const courseRes = await getCourseById(id);
                setCourse(courseRes.data.course);
            } catch {
                setError('Cannot load course information.');
            } finally {
                setLoading(false);
            }
        };

        const loadReviews = async () => {
            setReviewsLoading(true);
            setReviewsError(null);
            try {
                const reviewsRes = await getCourseReviews(id);
                setReviews(reviewsRes.data.reviews || []);
            } catch {
                setReviewsError('Cannot load reviews.');
            } finally {
                setReviewsLoading(false);
            }
        };

        loadCourse();
        loadReviews();
    }, [id]);

    const reviewCount = reviews.length;
    const averageRating = reviewCount > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1)
        : null;

    const handleEnroll = async () => {
        setEnrollLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await enrollInCourse(id);
            setSuccess('Course enrolled successfully. Please check your class assignment status.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to enroll in course.');
        } finally {
            setEnrollLoading(false);
        }
    };

    if (loading) {
        return <div className="container-fluid py-5 text-center text-muted fw-semibold">Loading course details...</div>;
    }

    if (error) {
        return (
            <div className="container-fluid px-0 py-3">
                <div className="alert alert-danger py-2.5">{error}</div>
            </div>
        );
    }

    return (
        <div className="container-fluid px-0 py-3">
            {/* 1. Hero Banner Block */}
            <div className="bg-dark text-white py-5 mb-4 rounded-4 shadow-sm position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
                <div className="col-lg-8 p-0 px-4 position-relative" style={{ zIndex: 2 }}>
                    <span className="badge bg-primary rounded-pill px-3 py-1.5 mb-3 text-uppercase fw-bold animate-pulse" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                        {course.category?.name || 'General'}
                    </span>
                    <h1 className="display-6 fw-bold text-white mb-3">{course.title}</h1>
                    <p className="lead mb-4 opacity-90 small" style={{ fontSize: '1rem', maxWidth: '750px' }}>{course.description}</p>
                    <div className="d-flex flex-wrap gap-3 align-items-center small text-white-50">
                        <span className="badge bg-warning text-dark px-2.5 py-1.5 fw-bold rounded-2">
                            ★ {averageRating ? `${averageRating}/5` : 'No reviews'} Course Rating
                        </span>
                        <span>•</span>
                        <span className="text-white">{course.durationWeeks || 'N/A'} weeks duration</span>
                        <span>•</span>
                        <span className="text-white">{course.sessionCount || 'N/A'} lessons total</span>
                    </div>
                </div>
            </div>

            {/* 2. Two-column Grid */}
            <div className="row g-4">
                {/* Left column (70% width) */}
                <div className="col-lg-8 d-flex flex-column gap-4">
                    {/* Course Overview details */}
                    <div className="card border-0 shadow-sm rounded-4 p-4">
                        <h4 className="fw-bold text-dark mb-3 fs-5">About this course</h4>
                        <p className="text-muted small mb-0">{course.description}</p>
                    </div>

{/* 4. Student Reviews List */}
                    <div className="card border-0 shadow-sm rounded-4 p-4">
                        <h4 className="fw-bold text-dark mb-4 fs-5">Student Reviews ({reviewCount})</h4>
                        {reviewsLoading ? (
                            <div className="text-center py-4 text-muted fw-semibold small">Loading reviews...</div>
                        ) : reviewsError ? (
                            <div className="alert alert-danger py-2.5 small mb-0">{reviewsError}</div>
                        ) : reviews.length === 0 ? (
                            <div className="text-center py-4 text-muted fw-semibold small">No reviews yet.</div>
                        ) : (
                            <div className="row g-3">
                                {reviews.map((review) => {
                                    const displayName = review.user?.fullName?.trim() || 'Anonymous';
                                    const initials = displayName
                                        .split(' ')
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .map((word) => word[0]?.toUpperCase())
                                        .join('') || 'U';

                                    return (
                                        <div key={review._id} className="col-md-6">
                                            <div className="p-3 bg-light rounded-3 border h-100 d-flex flex-column justify-content-between">
                                                <div>
                                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                                        <div className="d-flex align-items-center gap-2">
                                                            {review.user?.avatar ? (
                                                                <img
                                                                    src={review.user.avatar}
                                                                    className="rounded-circle object-fit-cover"
                                                                    style={{ width: '28px', height: '28px' }}
                                                                    alt={displayName}
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="account-avatar flex-shrink-0"
                                                                    style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}
                                                                >
                                                                    {initials}
                                                                </span>
                                                            )}
                                                            <strong className="text-dark small">{displayName}</strong>
                                                        </div>
                                                        <span className="badge bg-warning text-dark fw-bold px-2 py-1">
                                                            ★ {review.rating?.toFixed(1) || '0.0'}
                                                        </span>
                                                    </div>
                                                    <p className="text-muted small mb-0">"{review.content}"</p>
                                                </div>
                                                {review.createdAt && (
                                                    <div className="text-end mt-2">
                                                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column (30% width) - Sticky info card */}
                <div className="col-lg-4">
                    <div className="position-sticky" style={{ top: '24px' }}>
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div style={{ height: '180px', position: 'relative' }}>
                                <CourseImage course={course} className="w-100 h-100 object-fit-cover" />
                            </div>
                            <div className="card-body p-4">
                                <h3 className="fw-bold text-primary mb-3.5">{course.price?.toLocaleString('vi-VN')} VND</h3>
                                
                                <div className="d-flex flex-column gap-2.5 mb-4">
                                    <div className="d-flex justify-content-between text-muted small">
                                        <span>Category:</span>
                                        <span className="fw-bold text-dark">{course.category?.name || 'General'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between text-muted small border-top pt-2.5">
                                        <span>Duration:</span>
                                        <span className="fw-bold text-dark">{course.durationWeeks || 'N/A'} weeks</span>
                                    </div>
                                    <div className="d-flex justify-content-between text-muted small border-top pt-2.5">
                                        <span>Lessons:</span>
                                        <span className="fw-bold text-dark">{course.sessionCount || 'N/A'} lectures</span>
                                    </div>
                                </div>

                                <p className="text-muted small mb-4 text-center">
                                    {Number(course.price || 0) === 0 
                                        ? 'Enroll directly and wait for class assignment.' 
                                        : 'Review the final amount before continuing to VNPAY.'}
                                </p>

                                <div className="d-grid gap-2">
                                    {Number(course.price || 0) === 0 ? (
                                        <button className="btn btn-primary py-2.5 rounded-3 fw-bold auth-primary-btn" type="button" onClick={handleEnroll} disabled={enrollLoading}>
                                            {enrollLoading ? 'Processing...' : 'Enroll now'}
                                        </button>
                                    ) : (
                                        <Link className="btn btn-primary py-2.5 rounded-3 fw-bold auth-primary-btn text-center" to={`/checkout/${id}`}>
                                            Continue to checkout
                                        </Link>
                                    )}
                                </div>

                                {success && <div className="alert alert-success py-2 mt-3 small mb-0">{success}</div>}
                                {error && <div className="alert alert-danger py-2 mt-3 small mb-0">{error}</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;

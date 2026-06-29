import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCourseById, getCourseChapters, getCourseProgress } from '../services/course';
import { createVnpayPayment } from '../services/payment';
import { enrollInCourse } from '../services/enrollment';
import { getMyLoyalty } from '../services/loyalty';
import CourseImage from '../components/CourseImage';
import PaginationControls from '../components/PaginationControls';
import { createPagination } from '../utils/pagination';

const CourseDetail = () => {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [chapterPage, setChapterPage] = useState(1);
    const [loyalty, setLoyalty] = useState(null);
    const [checkoutOptions, setCheckoutOptions] = useState({ couponCode: '', pointsToUse: '' });
    const pagedChapters = createPagination(chapters, chapterPage, 5);

    useEffect(() => {
        const loadCourse = async () => {
            setLoading(true);
            setError(null);
            try {
                const [courseRes, chaptersRes, progressRes, loyaltyRes] = await Promise.all([
                    getCourseById(id),
                    getCourseChapters(id),
                    getCourseProgress(id),
                    getMyLoyalty().catch(() => ({ data: null }))
                ]);
                setCourse(courseRes.data.course);
                setChapters(chaptersRes.data.chapters);
                setProgress(progressRes.data.progress);
                setLoyalty(loyaltyRes.data);
            } catch {
                setError('Cannot load course information.');
            } finally {
                setLoading(false);
            }
        };

        loadCourse();
    }, [id]);

    const handleCheckout = async () => {
        setCheckoutLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await createVnpayPayment(id, {
                couponCode: checkoutOptions.couponCode.trim(),
                pointsToUse: Number(checkoutOptions.pointsToUse || 0)
            });
            if (response.data.paid) {
                setSuccess('Course paid successfully with coupon or loyalty points.');
                const loyaltyRes = await getMyLoyalty().catch(() => ({ data: loyalty }));
                setLoyalty(loyaltyRes.data);
                return;
            }
            window.location.href = response.data.paymentUrl;
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to create payment.');
        } finally {
            setCheckoutLoading(false);
        }
    };

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
        return <div className="container py-5">Loading course details...</div>;
    }

    if (error) {
        return <div className="container py-5"><div className="alert alert-danger">{error}</div></div>;
    }

    return (
        <div className="course-detail-page container py-5">
            <div className="row gy-4">
                <div className="col-lg-8">
                    <div className="card p-4">
                        <CourseImage course={course} className="course-detail-image mb-4" />
                        <h2>{course.title}</h2>
                        <p>{course.description}</p>
                        <p><strong>Price:</strong> {course.price?.toLocaleString('vi-VN')} VND</p>
                        <p><strong>Category:</strong> {course.category?.name || 'General'}</p>
                        <p><strong>Duration:</strong> {course.durationWeeks || 'N/A'} weeks</p>
                        <p><strong>Sessions:</strong> {course.sessionCount || 'N/A'}</p>
                    </div>

                    <div className="card p-4 mt-4">
                        <h3>Curriculum</h3>
                        {chapters.length === 0 ? (
                            <p>Course content is not available yet.</p>
                        ) : (
                            <div className="accordion" id="chapterAccordion">
                                {pagedChapters.items.map((chapter) => (
                                    <div key={chapter._id} className="accordion-item">
                                        <h2 className="accordion-header" id={`heading-${chapter._id}`}>
                                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${chapter._id}`} aria-expanded="false" aria-controls={`collapse-${chapter._id}`}>
                                                {chapter.title}
                                            </button>
                                        </h2>
                                        <div id={`collapse-${chapter._id}`} className="accordion-collapse collapse" aria-labelledby={`heading-${chapter._id}`} data-bs-parent="#chapterAccordion">
                                            <div className="accordion-body">
                                                <p>{chapter.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {chapters.length > 0 && <PaginationControls pagination={pagedChapters.pagination} onPageChange={setChapterPage} itemLabel="chapters" />}
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card p-4 mb-4">
                        <h3>Progress</h3>
                        <p>Status: {progress?.status}</p>
                        <p>Completion: {progress?.progress}%</p>
                        <div className="progress">
                            <div className="progress-bar" role="progressbar" style={{ width: `${progress?.progress}%` }} aria-valuenow={progress?.progress} aria-valuemin="0" aria-valuemax="100">
                                {progress?.progress}%
                            </div>
                        </div>
                    </div>

                    <div className="card p-4 mb-4">
                        <h3>Quick actions</h3>
                        <p>{Number(course.price || 0) === 0 ? 'Enroll directly and wait for class assignment.' : 'Start the payment flow to enroll and get assigned to a class.'}</p>
                        {Number(course.price || 0) > 0 && (
                            <div className="row gy-3 mb-3">
                                <div className="col-12">
                                    <label className="form-label">Coupon code</label>
                                    <input
                                        className="form-control"
                                        placeholder="Example: IELTS10"
                                        value={checkoutOptions.couponCode}
                                        onChange={(event) => setCheckoutOptions((current) => ({ ...current, couponCode: event.target.value }))}
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label">Use loyalty points</label>
                                    <input
                                        className="form-control"
                                        type="number"
                                        min="0"
                                        max={loyalty?.balance || 0}
                                        placeholder={`Available: ${loyalty?.balance || 0}`}
                                        value={checkoutOptions.pointsToUse}
                                        onChange={(event) => setCheckoutOptions((current) => ({ ...current, pointsToUse: event.target.value }))}
                                    />
                                    <small className="text-muted">
                                        Balance: {loyalty?.balance || 0} points
                                        {loyalty?.pointValueVnd ? ` - ${loyalty.pointValueVnd.toLocaleString('vi-VN')} VND / point` : ''}
                                    </small>
                                </div>
                            </div>
                        )}
                        <div className="d-grid gap-2 mt-3">
                            {Number(course.price || 0) === 0 ? (
                                <button className="btn btn-outline-primary" type="button" onClick={handleEnroll} disabled={enrollLoading}>
                                    {enrollLoading ? 'Processing...' : 'Enroll now'}
                                </button>
                            ) : (
                                <button className="btn btn-primary" type="button" onClick={handleCheckout} disabled={checkoutLoading}>
                                    {checkoutLoading ? 'Processing...' : 'Checkout with VNPAY'}
                                </button>
                            )}
                        </div>
                        {success && <div className="alert alert-success mt-3">{success}</div>}
                        {error && <div className="alert alert-danger mt-3">{error}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;

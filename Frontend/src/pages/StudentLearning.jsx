import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssignments, submitAssignment } from '../services/assignment';
import { getMyAttendance, markAttendance } from '../services/attendance';
import { getMyCertificates, getCertificatePdfUrl } from '../services/certificate';
import { getCourseChapters } from '../services/course';
import { createClassComment, getClassComments } from '../services/discussion';
import { getEnrollments } from '../services/enrollment';
import { completeLesson, getLessonsByChapter } from '../services/lesson';
import { createReview, getCourseReviews } from '../services/review';
import { addToWishlist, getWishlist, removeFromWishlist } from '../services/wishlist';
import PaginationControls from '../components/PaginationControls';
import { createPagination } from '../utils/pagination';

const getId = (value) => value?._id || value || '';

const StudentLearning = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');
    const [chapters, setChapters] = useState([]);
    const [lessonsByChapter, setLessonsByChapter] = useState({});
    const [activeLesson, setActiveLesson] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [comments, setComments] = useState([]);
    const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
    const [commentForm, setCommentForm] = useState({ title: '', content: '' });
    const [submissionForm, setSubmissionForm] = useState({});
    const [pages, setPages] = useState({});
    const [watchedPercent, setWatchedPercent] = useState(0);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const selectedEnrollment = useMemo(
        () => enrollments.find((item) => item._id === selectedEnrollmentId) || enrollments[0],
        [enrollments, selectedEnrollmentId]
    );

    const courseId = getId(selectedEnrollment?.course);
    const classId = getId(selectedEnrollment?.class);
    const wishlistCourseIds = useMemo(
        () => new Set(wishlist.map((item) => getId(item.course))),
        [wishlist]
    );

    const loadBasics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [enrollmentRes, attendanceRes, certificateRes, wishlistRes] = await Promise.all([
                getEnrollments(),
                getMyAttendance(),
                getMyCertificates(),
                getWishlist()
            ]);

            const enrollmentItems = enrollmentRes.data.enrollments || [];
            setEnrollments(enrollmentItems);
            setSelectedEnrollmentId((current) => current || enrollmentItems[0]?._id || '');
            setAttendance(attendanceRes.data.attendances || []);
            setCertificates(certificateRes.data.certificates || []);
            setWishlist(wishlistRes.data.wishlists || []);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot load learning workspace.');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadCourseDetails = useCallback(async () => {
        if (!courseId) {
            setChapters([]);
            setLessonsByChapter({});
            setAssignments([]);
            setReviews([]);
            setComments([]);
            setActiveLesson(null);
            return;
        }

        setDetailLoading(true);
        setError(null);
        try {
            const [chapterRes, assignmentRes, reviewRes, commentRes] = await Promise.all([
                getCourseChapters(courseId),
                getAssignments({ course: courseId, class: classId || undefined }),
                getCourseReviews(courseId),
                classId ? getClassComments(classId) : Promise.resolve({ data: { comments: [] } })
            ]);

            const chapterItems = chapterRes.data.chapters || chapterRes.data || [];
            const lessonEntries = await Promise.all(
                chapterItems.map(async (chapter) => {
                    const lessonRes = await getLessonsByChapter(chapter._id);
                    return [chapter._id, lessonRes.data.lessons || lessonRes.data || []];
                })
            );
            const lessonsMap = Object.fromEntries(lessonEntries);
            const firstLesson = lessonEntries.flatMap(([, lessons]) => lessons)[0] || null;

            setChapters(chapterItems);
            setLessonsByChapter(lessonsMap);
            setActiveLesson(firstLesson);
            setAssignments(assignmentRes.data.assignments || []);
            setReviews(reviewRes.data.reviews || []);
            setComments(commentRes.data.comments || []);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot load course learning details.');
        } finally {
            setDetailLoading(false);
        }
    }, [classId, courseId]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadBasics();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadBasics]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadCourseDetails();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadCourseDetails]);

    const selectedCourseTitle = selectedEnrollment?.course?.title || 'Selected course';
    const isWishlisted = courseId ? wishlistCourseIds.has(courseId) : false;
    const paginate = (key, items) => createPagination(items, pages[key] || 1, 5);
    const setPage = (key, page) => setPages((current) => ({ ...current, [key]: page }));
    const pagedCertificates = paginate('certificates', certificates);
    const pagedAssignments = paginate('assignments', assignments);
    const pagedReviews = paginate('reviews', reviews);
    const pagedComments = paginate('comments', comments);
    const pagedAttendance = paginate('attendance', attendance);

    const handleToggleWishlist = async () => {
        if (!courseId) return;
        setError(null);
        setSuccess(null);
        try {
            if (isWishlisted) {
                await removeFromWishlist(courseId);
                setSuccess('Removed from wishlist.');
            } else {
                await addToWishlist(courseId);
                setSuccess('Added to wishlist.');
            }
            const response = await getWishlist();
            setWishlist(response.data.wishlists || []);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot update wishlist.');
        }
    };

    const handleCompleteLesson = async () => {
        if (!activeLesson?._id) return;
        setError(null);
        setSuccess(null);
        try {
            await completeLesson(activeLesson._id);
            if (classId) {
                await markAttendance({
                    class: classId,
                    lesson: activeLesson._id,
                    method: 'VIDEO_WATCH',
                    watchedPercent: Number(watchedPercent)
                });
                const attendanceRes = await getMyAttendance();
                setAttendance(attendanceRes.data.attendances || []);
            }
            await loadBasics();
            setSuccess('Lesson progress saved.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot complete lesson.');
        }
    };

    const handleReviewSubmit = async (event) => {
        event.preventDefault();
        if (!courseId) return;
        setError(null);
        setSuccess(null);
        try {
            await createReview({
                course: courseId,
                rating: Number(reviewForm.rating),
                content: reviewForm.content
            });
            const response = await getCourseReviews(courseId);
            setReviews(response.data.reviews || []);
            setReviewForm({ rating: 5, content: '' });
            setSuccess('Review saved.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot save review.');
        }
    };

    const handleCommentSubmit = async (event) => {
        event.preventDefault();
        if (!classId) return;
        setError(null);
        setSuccess(null);
        try {
            await createClassComment({
                class: classId,
                title: commentForm.title,
                content: commentForm.content
            });
            const response = await getClassComments(classId);
            setComments(response.data.comments || []);
            setCommentForm({ title: '', content: '' });
            setSuccess('Discussion comment posted.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot post comment.');
        }
    };

    const handleAssignmentSubmit = async (assignmentId) => {
        const payload = submissionForm[assignmentId] || {};
        setError(null);
        setSuccess(null);
        try {
            await submitAssignment(assignmentId, payload);
            setSubmissionForm((current) => ({ ...current, [assignmentId]: { content: '', fileUrl: '' } }));
            setSuccess('Assignment submitted.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot submit assignment.');
        }
    };

    const renderLessonContent = () => {
        if (!activeLesson) return <div className="alert alert-secondary">Choose a lesson to start learning.</div>;
        const type = activeLesson.contentType;
        const url = activeLesson.contentUrl;

        if (!url) {
            return <p className="text-muted">{activeLesson.description || 'No lesson content URL is available yet.'}</p>;
        }

        if (type === 'VIDEO') {
            return <video className="w-100 rounded" src={url} controls />;
        }

        if (type === 'AUDIO') {
            return <audio className="w-100" src={url} controls />;
        }

        if (['PDF', 'DOCX', 'PPT'].includes(type)) {
            return <iframe className="w-100 rounded border" src={url} title={activeLesson.title} style={{ minHeight: 420 }} />;
        }

        return (
            <a href={url} target="_blank" rel="noreferrer" className="btn btn-outline-primary">
                Open lesson resource
            </a>
        );
    };

    if (loading) {
        return <div className="container py-5">Loading learning workspace...</div>;
    }

    return (
        <div className="container py-5">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <span className="eyebrow">Student workspace</span>
                    <h2 className="mb-1">My Learning</h2>
                    <p className="text-muted mb-0">Study lessons, submit work, join discussion, and track certificates.</p>
                </div>
                <Link className="btn btn-outline-primary" to="/courses">Browse courses</Link>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {enrollments.length === 0 ? (
                <div className="alert alert-secondary">You have not enrolled in any course yet.</div>
            ) : (
                <>
                    <section className="card p-4 mb-4">
                        <div className="row gy-3 align-items-end">
                            <div className="col-lg-8">
                                <label className="form-label" htmlFor="learning-course">Current enrollment</label>
                                <select
                                    id="learning-course"
                                    className="form-select"
                                    value={selectedEnrollment?._id || ''}
                                    onChange={(event) => setSelectedEnrollmentId(event.target.value)}
                                >
                                    {enrollments.map((enrollment) => (
                                        <option key={enrollment._id} value={enrollment._id}>
                                            {enrollment.course?.title || 'Untitled course'} - {enrollment.status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-lg-4">
                                <button className="btn btn-outline-danger w-100" type="button" onClick={handleToggleWishlist}>
                                    {isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                                </button>
                            </div>
                        </div>
                        <div className="progress mt-3">
                            <div className="progress-bar" style={{ width: `${selectedEnrollment?.progress || 0}%` }}>
                                {selectedEnrollment?.progress || 0}%
                            </div>
                        </div>
                    </section>

                    {detailLoading ? (
                        <div className="alert alert-info">Loading course details...</div>
                    ) : (
                        <div className="row gy-4">
                            <div className="col-lg-4">
                                <div className="card p-4 mb-4">
                                    <h4>Curriculum</h4>
                                    {chapters.length === 0 ? (
                                        <p className="text-muted">No chapter is available.</p>
                                    ) : (
                                        chapters.map((chapter) => (
                                            <div key={chapter._id} className="mb-3">
                                                <h6 className="mb-2">{chapter.title}</h6>
                                                <div className="list-group">
                                                    {(lessonsByChapter[chapter._id] || []).map((lesson) => (
                                                        <button
                                                            type="button"
                                                            key={lesson._id}
                                                            className={`list-group-item list-group-item-action ${activeLesson?._id === lesson._id ? 'active' : ''}`}
                                                            onClick={() => setActiveLesson(lesson)}
                                                        >
                                                            {lesson.title}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="card p-4">
                                    <h4>Certificates</h4>
                                    {certificates.length === 0 ? (
                                        <p className="text-muted">No certificate has been issued yet.</p>
                                    ) : (
                                        pagedCertificates.items.map((certificate) => (
                                            <div key={certificate._id} className="border-bottom py-2">
                                                <div className="fw-semibold">{certificate.course?.title}</div>
                                                <small className="text-muted">{certificate.certificateCode}</small>
                                                <div>
                                                    <a href={getCertificatePdfUrl(certificate.certificateCode)} target="_blank" rel="noreferrer">
                                                        Download PDF
                                                    </a>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {certificates.length > 0 && <PaginationControls pagination={pagedCertificates.pagination} onPageChange={(page) => setPage('certificates', page)} itemLabel="certificates" />}
                                </div>
                            </div>

                            <div className="col-lg-8">
                                <div className="card p-4 mb-4">
                                    <div className="d-flex flex-wrap justify-content-between gap-3">
                                        <div>
                                            <h3 className="mb-1">{activeLesson?.title || selectedCourseTitle}</h3>
                                            <p className="text-muted mb-0">{activeLesson?.description}</p>
                                        </div>
                                        <span className="badge text-bg-light align-self-start">{activeLesson?.contentType || 'LESSON'}</span>
                                    </div>
                                    <div className="my-3">{renderLessonContent()}</div>
                                    <div className="row gy-3 align-items-end">
                                        <div className="col-md-8">
                                            <label className="form-label" htmlFor="watched-percent">Watched percent</label>
                                            <input
                                                id="watched-percent"
                                                className="form-range"
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={watchedPercent}
                                                onChange={(event) => setWatchedPercent(event.target.value)}
                                            />
                                            <small>{watchedPercent}% watched</small>
                                        </div>
                                        <div className="col-md-4">
                                            <button className="btn btn-primary w-100" type="button" onClick={handleCompleteLesson} disabled={!activeLesson}>
                                                Mark complete
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="card p-4 mb-4">
                                    <h4>Assignments</h4>
                                    {assignments.length === 0 ? (
                                        <p className="text-muted">No assignment is available for this course.</p>
                                    ) : (
                                        pagedAssignments.items.map((assignment) => {
                                            const formValue = submissionForm[assignment._id] || {};
                                            return (
                                                <div key={assignment._id} className="border-bottom py-3">
                                                    <div className="d-flex justify-content-between gap-3">
                                                        <div>
                                                            <h6>{assignment.title}</h6>
                                                            <p className="text-muted mb-2">{assignment.description}</p>
                                                        </div>
                                                        <span className="badge text-bg-light">{assignment.maxScore} pts</span>
                                                    </div>
                                                    <textarea
                                                        className="form-control mb-2"
                                                        rows="3"
                                                        placeholder="Submission content"
                                                        value={formValue.content || ''}
                                                        onChange={(event) => setSubmissionForm((current) => ({
                                                            ...current,
                                                            [assignment._id]: { ...formValue, content: event.target.value }
                                                        }))}
                                                    />
                                                    <input
                                                        className="form-control mb-2"
                                                        placeholder="File URL"
                                                        value={formValue.fileUrl || ''}
                                                        onChange={(event) => setSubmissionForm((current) => ({
                                                            ...current,
                                                            [assignment._id]: { ...formValue, fileUrl: event.target.value }
                                                        }))}
                                                    />
                                                    <button className="btn btn-outline-primary" type="button" onClick={() => handleAssignmentSubmit(assignment._id)} disabled={!formValue.content && !formValue.fileUrl}>
                                                        Submit assignment
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                    {assignments.length > 0 && <PaginationControls pagination={pagedAssignments.pagination} onPageChange={(page) => setPage('assignments', page)} itemLabel="assignments" />}
                                </div>

                                <div className="card p-4 mb-4">
                                    <h4>Course review</h4>
                                    <form className="row gy-3" onSubmit={handleReviewSubmit}>
                                        <div className="col-md-3">
                                            <label className="form-label" htmlFor="review-rating">Rating</label>
                                            <select
                                                id="review-rating"
                                                className="form-select"
                                                value={reviewForm.rating}
                                                onChange={(event) => setReviewForm((current) => ({ ...current, rating: event.target.value }))}
                                            >
                                                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-md-9">
                                            <label className="form-label" htmlFor="review-content">Content</label>
                                            <input
                                                id="review-content"
                                                className="form-control"
                                                value={reviewForm.content}
                                                onChange={(event) => setReviewForm((current) => ({ ...current, content: event.target.value }))}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <button className="btn btn-primary" type="submit">Save review</button>
                                        </div>
                                    </form>
                                    <div className="mt-3">
                                        {pagedReviews.items.map((review) => (
                                            <div key={review._id} className="border-top py-2">
                                                <strong>{review.rating}/5</strong> {review.content}
                                            </div>
                                        ))}
                                        {reviews.length > 0 && <PaginationControls pagination={pagedReviews.pagination} onPageChange={(page) => setPage('reviews', page)} itemLabel="reviews" />}
                                    </div>
                                </div>

                                <div className="card p-4 mb-4">
                                    <h4>Class discussion</h4>
                                    {classId ? (
                                        <>
                                            <form className="row gy-3" onSubmit={handleCommentSubmit}>
                                                <div className="col-md-4">
                                                    <input
                                                        className="form-control"
                                                        placeholder="Title"
                                                        value={commentForm.title}
                                                        onChange={(event) => setCommentForm((current) => ({ ...current, title: event.target.value }))}
                                                    />
                                                </div>
                                                <div className="col-md-8">
                                                    <input
                                                        className="form-control"
                                                        placeholder="Comment"
                                                        value={commentForm.content}
                                                        onChange={(event) => setCommentForm((current) => ({ ...current, content: event.target.value }))}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <button className="btn btn-primary" type="submit">Post comment</button>
                                                </div>
                                            </form>
                                            <div className="mt-3">
                                                {comments.length === 0 ? (
                                                    <p className="text-muted">No discussion yet.</p>
                                                ) : pagedComments.items.map((comment) => (
                                                    <div key={comment._id} className="border-top py-2">
                                                        <div className="fw-semibold">{comment.title || 'Discussion'}</div>
                                                        <div>{comment.content}</div>
                                                        <small className="text-muted">{comment.author?.fullName || 'Member'}</small>
                                                    </div>
                                                ))}
                                                {comments.length > 0 && <PaginationControls pagination={pagedComments.pagination} onPageChange={(page) => setPage('comments', page)} itemLabel="comments" />}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-muted">You need to be assigned to a class before joining discussion.</p>
                                    )}
                                </div>

                                <div className="card p-4">
                                    <h4>Attendance history</h4>
                                    {attendance.length === 0 ? (
                                        <p className="text-muted">No attendance record yet.</p>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table align-middle">
                                                <thead>
                                                    <tr>
                                                        <th>Class</th>
                                                        <th>Lesson</th>
                                                        <th>Watched</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pagedAttendance.items.map((item) => (
                                                        <tr key={item._id}>
                                                            <td>{item.class?.code || '-'}</td>
                                                            <td>{item.lesson?.title || '-'}</td>
                                                            <td>{item.watchedPercent || 0}%</td>
                                                            <td>{item.attended ? 'Attended' : 'Missing'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {attendance.length > 0 && <PaginationControls pagination={pagedAttendance.pagination} onPageChange={(page) => setPage('attendance', page)} itemLabel="attendance records" />}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentLearning;

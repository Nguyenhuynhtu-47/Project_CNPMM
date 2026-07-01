import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssignments, submitAssignment } from '../services/assignment';
import { getMyAttendance, markAttendance } from '../services/attendance';
import { getMyCertificates, getCertificatePdfUrl } from '../services/certificate';
import { getChaptersByClass } from '../services/chapter';
import { createClassComment, getClassComments } from '../services/discussion';
import { getEnrollments } from '../services/enrollment';
import { completeLesson, getLessonsByChapter } from '../services/lesson';
import { getQuizzesByClass } from '../services/quiz';
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
    const [quizzes, setQuizzes] = useState([]);
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

    // Tab state for the main learning area tabs
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('quizzes');

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
        if (!courseId || !classId) {
            setChapters([]);
            setLessonsByChapter({});
            setQuizzes([]);
            setAssignments([]);
            setReviews([]);
            setComments([]);
            setActiveLesson(null);
            return;
        }

        setDetailLoading(true);
        setError(null);
        try {
            const [chapterRes, quizRes, assignmentRes, reviewRes, commentRes] = await Promise.all([
                getChaptersByClass(classId),
                classId ? getQuizzesByClass(classId) : Promise.resolve({ data: { quizzes: [] } }),
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
            setQuizzes(quizRes.data.quizzes || []);
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
    const pagedQuizzes = paginate('quizzes', quizzes);
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
            const response = await getAssignments({ course: courseId, class: classId || undefined });
            setAssignments(response.data.assignments || []);
            setSubmissionForm((current) => ({ ...current, [assignmentId]: { content: '', fileUrl: '' } }));
            setSuccess('Assignment submitted. It will be completed after teacher grading.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot submit assignment.');
        }
    };

    const renderLessonContent = () => {
        if (!activeLesson) return <div className="alert alert-secondary text-center w-100 py-5 my-0">Choose a lesson from the curriculum panel to start studying.</div>;
        const type = activeLesson.contentType;
        const url = activeLesson.contentUrl;

        if (!url) {
            return <p className="text-white opacity-75 px-4 text-center my-0">{activeLesson.description || 'No lesson content URL is available yet.'}</p>;
        }

        if (type === 'VIDEO') {
            return <video className="w-100 h-100 d-block rounded-3" src={url} controls style={{ maxHeight: '480px', objectFit: 'contain' }} />;
        }

        if (type === 'AUDIO') {
            return (
                <div className="w-100 p-4 bg-dark rounded-3 d-flex flex-column align-items-center justify-content-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary mb-3"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                    <audio className="w-100" src={url} controls />
                </div>
            );
        }

        if (['PDF', 'DOCX', 'PPT'].includes(type)) {
            return <iframe className="w-100 rounded-3 border-0 bg-white" src={url} title={activeLesson.title} style={{ minHeight: 480 }} />;
        }

        return (
            <div className="p-4 text-center">
                <a href={url} target="_blank" rel="noreferrer" className="btn btn-light px-4 py-2.5 rounded-3 fw-bold text-dark">
                    Open lesson resource
                </a>
            </div>
        );
    };

    if (loading) {
        return <div className="container-fluid py-5 text-center text-muted fw-semibold">Loading learning workspace...</div>;
    }

    return (
        <div className="container-fluid px-0 py-3">
            {/* Header Block */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 p-4 bg-white rounded-4 border">
                <div>
                    <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1.5 mb-2 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Student workspace</span>
                    <h2 className="fw-bold mb-1 text-dark">My Learning</h2>
                    <p className="text-muted mb-0 small">Study lessons, submit work, join discussion, and track certificates.</p>
                </div>
                <Link className="btn btn-outline-primary px-4 py-2 rounded-3 fw-bold flex-shrink-0" to="/courses">Browse courses</Link>
            </div>

            {error && <div className="alert alert-danger py-2.5 mb-4">{error}</div>}
            {success && <div className="alert alert-success py-2.5 mb-4">{success}</div>}

            {enrollments.length === 0 ? (
                <div className="alert alert-secondary py-3 text-center rounded-3">You have not enrolled in any course yet.</div>
            ) : (
                <div className="row g-4">
                    {/* LEFT COLUMN: Fixed Curriculum panel (25-30% width) */}
                    <aside className="col-lg-4 col-xl-3">
                        <div className="position-sticky d-flex flex-column gap-3" style={{ top: '24px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                            {/* Course Switcher selector inside sidebar */}
                            <div className="card border-0 shadow-sm rounded-4 p-3.5">
                                <label className="form-label small fw-semibold text-dark mb-1.5" htmlFor="learning-course">Current course</label>
                                <select
                                    id="learning-course"
                                    className="form-select form-select-sm py-2 rounded-3 bg-light border-0"
                                    value={selectedEnrollment?._id || ''}
                                    onChange={(event) => setSelectedEnrollmentId(event.target.value)}
                                >
                                    {enrollments.map((enrollment) => (
                                        <option key={enrollment._id} value={enrollment._id}>
                                            {enrollment.course?.title || 'Untitled course'}
                                        </option>
                                    ))}
                                </select>

                                <div className="mt-3">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="text-muted small" style={{ fontSize: '0.72rem' }}>Progress:</span>
                                        <span className="fw-bold text-primary small" style={{ fontSize: '0.72rem' }}>{selectedEnrollment?.progress || 0}%</span>
                                    </div>
                                    <div className="progress rounded-pill" style={{ height: '6px' }}>
                                        <div className="progress-bar" role="progressbar" style={{ width: `${selectedEnrollment?.progress || 0}%` }}></div>
                                    </div>
                                </div>

                                <button className="btn btn-outline-danger btn-sm py-1.5 rounded-3 fw-semibold w-100 mt-3" type="button" onClick={handleToggleWishlist}>
                                    {isWishlisted ? 'Remove wishlist' : 'Add to wishlist'}
                                </button>
                            </div>

                            {/* Sticky Curriculum Syllabus details */}
                            <div className="card border-0 shadow-sm rounded-4 p-3.5">
                                <h5 className="fw-bold text-dark mb-3">Curriculum</h5>
                                {chapters.length === 0 ? (
                                    <p className="text-muted mb-0 small">No chapters available.</p>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        {chapters.map((chapter) => (
                                            <div key={chapter._id} className="pb-1">
                                                <h6 className="fw-bold text-dark mb-2 small text-uppercase text-truncate" style={{ letterSpacing: '0.04em', fontSize: '0.75rem' }} title={chapter.title}>
                                                    {chapter.title}
                                                </h6>
                                                <div className="d-flex flex-column gap-1.5">
                                                    {(lessonsByChapter[chapter._id] || []).map((lesson) => (
                                                        <button
                                                            type="button"
                                                            key={lesson._id}
                                                            className={`btn btn-sm text-start px-3 py-2 rounded-3 border-0 text-truncate transition-all ${activeLesson?._id === lesson._id ? 'btn-primary shadow-sm' : 'text-muted bg-transparent hover-bg-light'}`}
                                                            style={{ fontSize: '0.8rem' }}
                                                            onClick={() => setActiveLesson(lesson)}
                                                            title={lesson.title}
                                                        >
                                                            {lesson.title}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* RIGHT COLUMN: Main learning area (70-75% width) */}
                    <main className="col-lg-8 col-xl-9">
                        {detailLoading ? (
                            <div className="alert alert-info py-3 text-center rounded-3">Loading course details...</div>
                        ) : (
                            <div className="d-flex flex-column gap-4">
                                {/* 3. Main Player & Lesson Block */}
                                <div className="card border-0 shadow-sm rounded-4 p-4">
                                    {/* Lesson Header */}
                                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                                        <div>
                                            <h3 className="fw-bold text-dark mb-1 fs-4">{activeLesson?.title || selectedCourseTitle}</h3>
                                            <p className="text-muted mb-0 small">{activeLesson?.description}</p>
                                        </div>
                                        <span className="badge bg-secondary-subtle text-secondary rounded-2 px-2.5 py-1.5 font-monospace fw-bold">{activeLesson?.contentType || 'LESSON'}</span>
                                    </div>

                                    {/* Lesson Content Player */}
                                    <div className="my-3 overflow-hidden rounded-4 bg-black d-flex align-items-center justify-content-center" style={{ minHeight: '320px' }}>
                                        {renderLessonContent()}
                                    </div>

                                    {/* Learning Progress Slider */}
                                    <div className="row g-3 align-items-center mt-3 pt-3 border-top">
                                        <div className="col-md-8">
                                            <label className="form-label small fw-semibold text-dark mb-1" htmlFor="watched-percent">Watched percent</label>
                                            <div className="d-flex align-items-center gap-3">
                                                <input
                                                    id="watched-percent"
                                                    className="form-range flex-grow-1"
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={watchedPercent}
                                                    onChange={(event) => setWatchedPercent(event.target.value)}
                                                />
                                                <span className="badge text-bg-light py-1.5 px-2 fw-bold font-monospace">{watchedPercent}%</span>
                                            </div>
                                        </div>
                                        <div className="col-md-4 d-flex justify-content-md-end">
                                            <button className="btn btn-primary py-2.5 rounded-3 fw-bold w-100 auth-primary-btn" type="button" onClick={handleCompleteLesson} disabled={!activeLesson}>
                                                Mark complete
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Tabbed interface block */}
                                <div className="card border-0 shadow-sm rounded-4 p-4">
                                    <ul className="nav nav-tabs gap-2 mb-4 border-bottom" id="learningTab" role="tablist">
                                        {[
                                            ['quizzes', 'Quizzes'],
                                            ['assignments', 'Assignments'],
                                            ['discussions', 'Discussions'],
                                            ['reviews', 'Reviews'],
                                            ['attendance', 'Attendance']
                                        ].map(([tabKey, tabLabel]) => (
                                            <li className="nav-item" key={tabKey} role="presentation">
                                                <button
                                                    className={`nav-link fw-semibold rounded-top-3 border-0 px-3.5 py-2.5 transition-all ${activeWorkspaceTab === tabKey ? 'active bg-primary text-white shadow-sm' : 'text-muted bg-transparent'}`}
                                                    id={`${tabKey}-tab`}
                                                    type="button"
                                                    role="tab"
                                                    onClick={() => setActiveWorkspaceTab(tabKey)}
                                                >
                                                    {tabLabel}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="tab-content" id="learningTabContent">
                                        {/* TAB: Quizzes */}
                                        {activeWorkspaceTab === 'quizzes' && (
                                            <div className="tab-pane fade show active" role="tabpanel">
                                                <h5 className="fw-bold text-dark mb-3">Quizzes</h5>
                                                {quizzes.length === 0 ? (
                                                    <p className="text-muted mb-0 small">No quizzes are available for this course yet.</p>
                                                ) : (
                                                    <div className="d-flex flex-column gap-3">
                                                        {pagedQuizzes.items.map((quiz) => (
                                                            <div key={quiz._id} className="p-3 border rounded-3 bg-white d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                                                <div>
                                                                    <h6 className="fw-bold text-dark mb-1">{quiz.title}</h6>
                                                                    <p className="text-muted mb-2 small">{quiz.description || 'Complete this quiz as part of your learning journey.'}</p>
                                                                    <small className="badge bg-light text-secondary rounded-2 px-2.5 py-1 fw-bold">
                                                                        {quiz.durationMinutes || quiz.timeLimitSeconds ? `Time limit: ${quiz.timeLimitSeconds ? `${quiz.timeLimitSeconds}s` : `${quiz.durationMinutes} minutes`}` : 'No time limit'}
                                                                    </small>
                                                                </div>
                                                                <Link className="btn btn-primary px-3 py-1.5 rounded-2 fw-semibold btn-sm flex-shrink-0" to={`/quizzes/${quiz._id}`}>
                                                                    Take quiz
                                                                </Link>
                                                            </div>
                                                        ))}
                                                        <PaginationControls pagination={pagedQuizzes.pagination} onPageChange={(page) => setPage('quizzes', page)} itemLabel="quizzes" />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* TAB: Assignments */}
                                        {activeWorkspaceTab === 'assignments' && (
                                            <div className="tab-pane fade show active" role="tabpanel">
                                                <h5 className="fw-bold text-dark mb-3">Assignments</h5>
                                                {assignments.length === 0 ? (
                                                    <p className="text-muted mb-0 small">No assignments are available for this course.</p>
                                                ) : (
                                                    <div className="d-flex flex-column gap-3">
                                                        {pagedAssignments.items.map((assignment) => {
                                                            const formValue = submissionForm[assignment._id] || {};
                                                            const submission = assignment.mySubmission;
                                                            const isCompleted = submission?.status === 'GRADED';
                                                            const isSubmitted = Boolean(submission);
                                                            return (
                                                                <div key={assignment._id} className="p-3 border rounded-3 bg-white">
                                                                    <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                                                                        <div>
                                                                            <h6 className="fw-bold text-dark mb-1">{assignment.title}</h6>
                                                                            <p className="text-muted small mb-2">{assignment.description}</p>
                                                                        </div>
                                                                        <span className="badge bg-primary-subtle text-primary rounded-2 px-2 py-1">{assignment.maxScore} pts</span>
                                                                    </div>
                                                                    {submission && (
                                                                        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                                                                            <span className={`badge px-2.5 py-1.5 rounded-2 fw-bold ${isCompleted ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                                                                                {isCompleted ? 'Completed' : 'Waiting teacher grade'}
                                                                            </span>
                                                                            {isCompleted && <span className="badge text-bg-light border px-2.5 py-1.5 rounded-2 fw-bold">Score: {submission.score ?? 0}/{assignment.maxScore}</span>}
                                                                            {submission.feedback && <span className="text-muted small ms-1">Feedback: {submission.feedback}</span>}
                                                                        </div>
                                                                    )}
                                                                    <textarea
                                                                        className="form-control mb-2 rounded-3 bg-light border-0 py-2.5 px-3 small"
                                                                        rows="3"
                                                                        placeholder="Submission content details..."
                                                                        value={formValue.content || ''}
                                                                        onChange={(event) => setSubmissionForm((current) => ({
                                                                            ...current,
                                                                            [assignment._id]: { ...formValue, content: event.target.value }
                                                                        }))}
                                                                    />
                                                                    <input
                                                                        className="form-control mb-3 rounded-3 bg-light border-0 py-2 px-3 small"
                                                                        placeholder="Attached file link URL"
                                                                        value={formValue.fileUrl || ''}
                                                                        onChange={(event) => setSubmissionForm((current) => ({
                                                                            ...current,
                                                                            [assignment._id]: { ...formValue, fileUrl: event.target.value }
                                                                        }))}
                                                                    />
                                                                    <button className="btn btn-outline-primary px-3 py-1.5 rounded-3 btn-sm fw-bold" type="button" onClick={() => handleAssignmentSubmit(assignment._id)} disabled={isCompleted || (!formValue.content && !formValue.fileUrl)}>
                                                                        {isCompleted ? 'Completed' : isSubmitted ? 'Resubmit before grading' : 'Submit assignment'}
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                        <PaginationControls pagination={pagedAssignments.pagination} onPageChange={(page) => setPage('assignments', page)} itemLabel="assignments" />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* TAB: Discussions */}
                                        {activeWorkspaceTab === 'discussions' && (
                                            <div className="tab-pane fade show active" role="tabpanel">
                                                <h5 className="fw-bold text-dark mb-3">Class discussion</h5>
                                                {classId ? (
                                                    <>
                                                        <form className="row g-3 mb-4 p-3 bg-light rounded-4 border" onSubmit={handleCommentSubmit}>
                                                            <div className="col-md-4">
                                                                <label className="form-label small fw-semibold text-dark">Discussion Title</label>
                                                                <input
                                                                    className="form-control bg-white py-2 rounded-3"
                                                                    placeholder="Title"
                                                                    value={commentForm.title}
                                                                    onChange={(event) => setCommentForm((current) => ({ ...current, title: event.target.value }))}
                                                                />
                                                            </div>
                                                            <div className="col-md-8">
                                                                <label className="form-label small fw-semibold text-dark">Your Comment</label>
                                                                <input
                                                                    className="form-control bg-white py-2 rounded-3"
                                                                    placeholder="Post a query or greeting..."
                                                                    value={commentForm.content}
                                                                    onChange={(event) => setCommentForm((current) => ({ ...current, content: event.target.value }))}
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="col-12 mt-3 text-end">
                                                                <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold auth-primary-btn" type="submit">Post comment</button>
                                                            </div>
                                                        </form>

                                                        <div className="d-flex flex-column gap-3">
                                                            {comments.length === 0 ? (
                                                                <p className="text-muted small mb-0">No discussion yet.</p>
                                                            ) : pagedComments.items.map((comment) => (
                                                                <div key={comment._id} className="p-3 border rounded-3 bg-white">
                                                                    <div className="fw-bold text-dark mb-1">{comment.title || 'Discussion'}</div>
                                                                    <div className="text-muted small mb-2">{comment.content}</div>
                                                                    <small className="badge text-bg-light px-2.5 py-1.5 rounded-2 fw-semibold">{comment.author?.fullName || 'Member'}</small>
                                                                </div>
                                                            ))}
                                                            {comments.length > 0 && <PaginationControls pagination={pagedComments.pagination} onPageChange={(page) => setPage('comments', page)} itemLabel="comments" />}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="text-muted mb-0 small">You need to be assigned to a class before joining discussion.</p>
                                                )}
                                            </div>
                                        )}

                                        {/* TAB: Reviews */}
                                        {activeWorkspaceTab === 'reviews' && (
                                            <div className="tab-pane fade show active" role="tabpanel">
                                                <h5 className="fw-bold text-dark mb-3">Course review</h5>
                                                {selectedEnrollment?.status === 'COMPLETED' ? (
                                                    <form className="row g-3 mb-4 p-3 bg-light rounded-4 border" onSubmit={handleReviewSubmit}>
                                                        <div className="col-md-3">
                                                            <label className="form-label small fw-semibold text-dark" htmlFor="review-rating">Rating</label>
                                                            <select
                                                                id="review-rating"
                                                                className="form-select bg-white rounded-3 py-2"
                                                                value={reviewForm.rating}
                                                                onChange={(event) => setReviewForm((current) => ({ ...current, rating: event.target.value }))}
                                                            >
                                                                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} Stars</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="col-md-9">
                                                            <label className="form-label small fw-semibold text-dark" htmlFor="review-content">Your Review</label>
                                                            <input
                                                                id="review-content"
                                                                className="form-control bg-white rounded-3 py-2"
                                                                placeholder="Tell us what you think of this course..."
                                                                value={reviewForm.content}
                                                                onChange={(event) => setReviewForm((current) => ({ ...current, content: event.target.value }))}
                                                            />
                                                        </div>
                                                        <div className="col-12 mt-3 text-end">
                                                            <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold auth-primary-btn" type="submit">Save review</button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <div className="alert alert-info py-2.5 small mb-4">
                                                        You can review this course after completing all lessons.
                                                    </div>
                                                )}

                                                <div className="d-flex flex-column gap-2.5">
                                                    {pagedReviews.items.map((review) => (
                                                        <div key={review._id} className="p-3 border rounded-3 bg-white d-flex align-items-start gap-2.5">
                                                            <span className="badge bg-warning text-dark fw-bold rounded-2 px-2 py-1 flex-shrink-0" style={{ fontSize: '0.8rem' }}>★ {review.rating}</span>
                                                            <span className="text-muted small">{review.content}</span>
                                                        </div>
                                                    ))}
                                                    {reviews.length > 0 && <PaginationControls pagination={pagedReviews.pagination} onPageChange={(page) => setPage('reviews', page)} itemLabel="reviews" />}
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: Attendance */}
                                        {activeWorkspaceTab === 'attendance' && (
                                            <div className="tab-pane fade show active" role="tabpanel">
                                                <h5 className="fw-bold text-dark mb-3">Attendance history</h5>
                                                {attendance.length === 0 ? (
                                                    <p className="text-muted mb-0 small">No attendance record yet.</p>
                                                ) : (
                                                    <div className="table-responsive rounded-3 border mb-2 bg-white">
                                                        <table className="table table-hover align-middle mb-0">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th className="ps-3">Class</th>
                                                                    <th>Lesson</th>
                                                                    <th>Watched</th>
                                                                    <th className="pe-3">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {pagedAttendance.items.map((item) => (
                                                                    <tr key={item._id}>
                                                                        <td className="ps-3"><span className="badge bg-secondary-subtle text-secondary font-monospace fw-bold">{item.class?.code || '-'}</span></td>
                                                                        <td>{item.lesson?.title || '-'}</td>
                                                                        <td className="fw-bold">{item.watchedPercent || 0}%</td>
                                                                        <td className="pe-3"><span className={`badge px-2.5 py-1.5 rounded-2 ${item.attended ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>{item.attended ? 'Attended' : 'Missing'}</span></td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                                {attendance.length > 0 && <PaginationControls pagination={pagedAttendance.pagination} onPageChange={(page) => setPage('attendance', page)} itemLabel="attendance records" />}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 5. Certificates Card placed below tab content */}
                                <div className="card border-0 shadow-sm rounded-4 p-4">
                                    <h4 className="fw-bold text-dark mb-3 fs-5">Certificates</h4>
                                    {certificates.length === 0 ? (
                                        <p className="text-muted mb-0 small">No certificates have been issued yet.</p>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            {pagedCertificates.items.map((certificate) => (
                                                <div key={certificate._id} className="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center gap-2">
                                                    <div className="overflow-hidden">
                                                        <div className="fw-semibold text-dark text-truncate small">{certificate.course?.title}</div>
                                                        <small className="text-muted font-monospace">{certificate.certificateCode}</small>
                                                    </div>
                                                    <a className="btn btn-sm btn-outline-primary fw-bold px-2.5 rounded-2 flex-shrink-0" href={getCertificatePdfUrl(certificate.certificateCode)} target="_blank" rel="noreferrer">
                                                        PDF
                                                    </a>
                                                </div>
                                            ))}
                                            <PaginationControls pagination={pagedCertificates.pagination} onPageChange={(page) => setPage('certificates', page)} itemLabel="certificates" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            )}
        </div>
    );
};

export default StudentLearning;

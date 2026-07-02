import { useCallback, useEffect, useMemo, useState } from 'react';
import { createAssignment, getAssignments, getAssignmentSubmissions, gradeSubmission, updateAssignment } from '../services/assignment';
import { getAttendance, markAttendance } from '../services/attendance';
import { createChapter, getChaptersByClass } from '../services/chapter';
import { getClassComments, pinClassComment } from '../services/discussion';
import { createLesson, deleteLesson, deleteLessonMaterial, getLessonsByChapter, reorderLessons, uploadLessonMedia } from '../services/lesson';
import { sendClassNotification } from '../services/notification';
import { createQuiz, getQuizzesByClass, updateQuiz } from '../services/quiz';
import { approveCourseCompletion, getAssignmentAnalytics, getTeacherClasses, getTeacherClassStudents } from '../services/teacher';
import PaginationControls from '../components/PaginationControls';
import { getEnrollmentStatusBadgeClass, getEnrollmentStatusLabel } from '../utils/enrollmentStatus';
import { createPagination } from '../utils/pagination';

const getId = (value) => value?._id || value || '';
const getTodayInputValue = () => new Date().toISOString().slice(0, 10);
const formatAttendanceDate = (item) => {
    const value = item.attendanceDate || item.attendedAt || item.createdAt;
    return value ? new Date(value).toLocaleDateString('vi-VN') : '-';
};

const getRequestErrorMessage = (error, fallback) => {
    const data = error.response?.data;
    if (data?.error && data?.message) return `${data.message}: ${data.error}`;
    return data?.message || error.message || fallback;
};

const emptyLesson = { title: '', description: '', contentType: 'VIDEO', contentUrl: '', durationMinutes: 0, order: 0 };
const emptyAssignment = { title: '', description: '', dueDate: '', maxScore: 100 };
const defaultQuizQuestion = {
    text: 'Sample question',
    type: 'MULTIPLE_CHOICE',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    points: 1
};

const normalizeQuizQuestion = (question = {}) => ({
    text: question.text || '',
    type: question.type === 'ESSAY' ? 'ESSAY' : 'MULTIPLE_CHOICE',
    options: (question.options?.length ? question.options : ['A', 'B', 'C', 'D']).map((option, index) => (
        typeof option === 'string' ? option : option.text || option.key || String.fromCharCode(65 + index)
    )),
    correctAnswer: question.correctAnswer || 'A',
    points: Number(question.points ?? question.score ?? 1)
});

const TeacherDashboard = () => {
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [students, setStudents] = useState([]);
    const [classEnrollments, setClassEnrollments] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [lessonsByChapter, setLessonsByChapter] = useState({});
    const [assignments, setAssignments] = useState([]);
    const [submissionsByAssignment, setSubmissionsByAssignment] = useState({});
    const [analyticsByAssignment, setAnalyticsByAssignment] = useState({});
    const [quizzes, setQuizzes] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [comments, setComments] = useState([]);
    const [chapterForm, setChapterForm] = useState({ title: '', description: '', order: 0 });
    const [lessonForm, setLessonForm] = useState(emptyLesson);
    const [lessonFile, setLessonFile] = useState(null);
    const [selectedChapterId, setSelectedChapterId] = useState('');
    const [materialFileByLesson, setMaterialFileByLesson] = useState({});
    const [assignmentForm, setAssignmentForm] = useState(emptyAssignment);
    const [editingAssignmentId, setEditingAssignmentId] = useState('');
    const [quizForm, setQuizForm] = useState({
        title: '',
        durationMinutes: 30,
        passScore: 70,
        maxAttempts: 1,
        questions: [defaultQuizQuestion]
    });
    const [editingQuizId, setEditingQuizId] = useState('');
    const [gradeForm, setGradeForm] = useState({});
    const [attendanceForm, setAttendanceForm] = useState({ student: '', attended: true, attendanceDate: getTodayInputValue(), note: '' });
    const [classNotificationForm, setClassNotificationForm] = useState({ title: '', message: '' });
    const [pages, setPages] = useState({});
    const [activeTab, setActiveTab] = useState('classes');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const selectedClass = useMemo(
        () => classes.find((item) => item._id === selectedClassId) || classes[0],
        [classes, selectedClassId]
    );
    const courseId = getId(selectedClass?.course);
    const classId = getId(selectedClass);

    const loadClasses = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getTeacherClasses();
            const items = response.data.classes || [];
            setClasses(items);
            setSelectedClassId((current) => current || items[0]?._id || '');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot load teacher classes.');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadClassDetails = useCallback(async () => {
        if (!classId || !courseId) {
            setStudents([]);
            setClassEnrollments([]);
            setChapters([]);
            setLessonsByChapter({});
            setAssignments([]);
            setQuizzes([]);
            setAttendance([]);
            setComments([]);
            return;
        }

        setError('');
        try {
            const [studentRes, chapterRes, assignmentRes, quizRes, attendanceRes, commentRes] = await Promise.all([
                getTeacherClassStudents(classId),
                getChaptersByClass(classId),
                getAssignments({ course: courseId, class: classId }),
                getQuizzesByClass(classId),
                getAttendance({ class: classId }),
                getClassComments(classId)
            ]);

            const chapterItems = chapterRes.data.chapters || chapterRes.data || [];
            const lessonEntries = await Promise.all(
                chapterItems.map(async (chapter) => {
                    const lessonRes = await getLessonsByChapter(chapter._id);
                    return [chapter._id, lessonRes.data.lessons || lessonRes.data || []];
                })
            );

            const assignmentItems = assignmentRes.data.assignments || [];
            const submissionEntries = await Promise.all(
                assignmentItems.map(async (assignment) => {
                    const [submissionRes, analyticsRes] = await Promise.all([
                        getAssignmentSubmissions(assignment._id),
                        getAssignmentAnalytics(assignment._id)
                    ]);
                    return [
                        assignment._id,
                        submissionRes.data.submissions || [],
                        analyticsRes.data
                    ];
                })
            );

            setStudents(studentRes.data.students || []);
            setClassEnrollments(studentRes.data.enrollments || []);
            setChapters(chapterItems);
            setSelectedChapterId((current) => current || chapterItems[0]?._id || '');
            setLessonsByChapter(Object.fromEntries(lessonEntries));
            setAssignments(assignmentItems);
            setSubmissionsByAssignment(Object.fromEntries(submissionEntries.map(([id, submissions]) => [id, submissions])));
            setAnalyticsByAssignment(Object.fromEntries(submissionEntries.map(([id, , analytics]) => [id, analytics])));
            setQuizzes(quizRes.data.quizzes || []);
            setAttendance(attendanceRes.data.attendances || []);
            setComments(commentRes.data.comments || []);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot load class details.');
        }
    }, [classId, courseId]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadClasses();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadClasses]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadClassDetails();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadClassDetails]);

    const reloadDetails = async (message) => {
        await loadClassDetails();
        setSuccess(message);
    };

    const handleCreateChapter = async (event) => {
        event.preventDefault();
        if (!courseId || !classId) return;
        setError('');
        setSuccess('');
        try {
            await createChapter({ ...chapterForm, course: courseId, class: classId, order: Number(chapterForm.order || 0) });
            setChapterForm({ title: '', description: '', order: 0 });
            await reloadDetails('Chapter created.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot create chapter.');
        }
    };

    const handleCreateLesson = async (event) => {
        event.preventDefault();
        if (!selectedChapterId) return;
        setError('');
        setSuccess('');
        const selectedFile = lessonFile;
        try {
            const response = await createLesson({
                ...lessonForm,
                chapter: selectedChapterId,
                durationMinutes: Number(lessonForm.durationMinutes || 0),
                order: Number(lessonForm.order || 0)
            });
            const createdLessonId = response.data?._id || response.data?.lesson?._id;
            if (selectedFile && createdLessonId) {
                try {
                    await uploadLessonMedia(createdLessonId, selectedFile);
                } catch (uploadError) {
                    if (!lessonForm.contentUrl) {
                        await deleteLesson(createdLessonId).catch(() => {});
                    }
                    throw uploadError;
                }
            }
            if (selectedFile && !createdLessonId) {
                throw new Error('Lesson was created but its id was not returned for file upload.');
            }
            setLessonForm(emptyLesson);
            setLessonFile(null);
            await reloadDetails(selectedFile ? 'Lesson created and material uploaded.' : 'Lesson created.');
        } catch (requestError) {
            setError(getRequestErrorMessage(requestError, 'Cannot create lesson or upload material.'));
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm('Delete this lesson?')) return;
        setError('');
        setSuccess('');
        try {
            await deleteLesson(lessonId);
            await reloadDetails('Lesson deleted.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot delete lesson.');
        }
    };

    const handleUploadMaterial = async (lessonId) => {
        const file = materialFileByLesson[lessonId];
        if (!file) return;
        setError('');
        setSuccess('');
        try {
            await uploadLessonMedia(lessonId, file);
            setMaterialFileByLesson((current) => ({ ...current, [lessonId]: null }));
            await reloadDetails('Material uploaded.');
        } catch (requestError) {
            setError(getRequestErrorMessage(requestError, 'Cannot upload material.'));
        }
    };

    const handleDeleteMaterial = async (lessonId) => {
        if (!window.confirm('Remove material from this lesson?')) return;
        setError('');
        setSuccess('');
        try {
            await deleteLessonMaterial(lessonId);
            await reloadDetails('Material deleted.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot delete material.');
        }
    };

    const handleReorderChapterLessons = async (chapterId) => {
        const lessons = lessonsByChapter[chapterId] || [];
        setError('');
        setSuccess('');
        try {
            await reorderLessons(chapterId, lessons.map((lesson, index) => ({ id: lesson._id, order: index + 1 })));
            await reloadDetails('Lessons reordered.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot reorder lessons.');
        }
    };

    const handleSaveAssignment = async (event) => {
        event.preventDefault();
        if (!courseId || !classId) return;
        setError('');
        setSuccess('');
        try {
            const payload = {
                ...assignmentForm,
                course: courseId,
                class: classId,
                maxScore: Number(assignmentForm.maxScore || 100)
            };
            if (editingAssignmentId) {
                await updateAssignment(editingAssignmentId, payload);
            } else {
                await createAssignment(payload);
            }
            setAssignmentForm(emptyAssignment);
            setEditingAssignmentId('');
            await reloadDetails(editingAssignmentId ? 'Assignment updated.' : 'Assignment created.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot save assignment.');
        }
    };

    const startEditAssignment = (assignment) => {
        setEditingAssignmentId(assignment._id);
        setAssignmentForm({
            title: assignment.title || '',
            description: assignment.description || '',
            dueDate: assignment.dueDate ? assignment.dueDate.slice(0, 10) : '',
            maxScore: assignment.maxScore || 100
        });
    };

    const handleGrade = async (submissionId, assignmentId) => {
        const form = gradeForm[submissionId] || {};
        setError('');
        setSuccess('');
        try {
            await gradeSubmission(submissionId, { score: Number(form.score || 0), feedback: form.feedback || '' });
            setGradeForm((current) => ({ ...current, [submissionId]: { score: '', feedback: '' } }));
            await reloadDetails(`Submission graded for ${assignments.find((item) => item._id === assignmentId)?.title || 'assignment'}.`);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot grade submission.');
        }
    };

    const handleApproveCompletion = async (enrollment) => {
        if (!window.confirm(`Mark ${enrollment.user?.fullName || enrollment.user?.email || 'this student'} as completed for this course?`)) return;
        setError('');
        setSuccess('');
        try {
            await approveCourseCompletion(enrollment._id, { note: 'Teacher confirmed course completion.' });
            await reloadDetails('Course completion approved.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot approve course completion.');
        }
    };

    const handleSaveQuiz = async (event) => {
        event.preventDefault();
        if (!courseId) return;
        setError('');
        setSuccess('');
        try {
            const questions = quizForm.questions.map(normalizeQuizQuestion).filter((question) => question.text.trim());
            if (!questions.length) {
                setError('Please add at least one quiz question.');
                return;
            }
            const payload = {
                course: courseId,
                class: classId,
                title: quizForm.title,
                durationMinutes: Number(quizForm.durationMinutes || 30),
                passScore: Number(quizForm.passScore || 70),
                maxAttempts: Number(quizForm.maxAttempts || 1),
                questions
            };
            if (editingQuizId) {
                await updateQuiz(editingQuizId, payload);
            } else {
                await createQuiz(payload);
            }
            setQuizForm({
                title: '',
                durationMinutes: 30,
                passScore: 70,
                maxAttempts: 1,
                questions: [defaultQuizQuestion]
            });
            setEditingQuizId('');
            await reloadDetails(editingQuizId ? 'Quiz updated.' : 'Quiz created.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || 'Cannot save quiz.');
        }
    };

    const startEditQuiz = (quiz) => {
        setEditingQuizId(quiz._id);
        setQuizForm({
            title: quiz.title || '',
            durationMinutes: quiz.durationMinutes || 30,
            passScore: 70,
            maxAttempts: quiz.attemptsAllowed || 1,
            questions: (quiz.questions?.length ? quiz.questions : [defaultQuizQuestion]).map(normalizeQuizQuestion)
        });
    };

    const updateQuizQuestion = (questionIndex, patch) => {
        setQuizForm((current) => ({
            ...current,
            questions: current.questions.map((question, index) => (
                index === questionIndex ? { ...question, ...patch } : question
            ))
        }));
    };

    const updateQuizOption = (questionIndex, optionIndex, value) => {
        setQuizForm((current) => ({
            ...current,
            questions: current.questions.map((question, index) => {
                if (index !== questionIndex) return question;
                const nextOptions = [...question.options];
                nextOptions[optionIndex] = value;
                return { ...question, options: nextOptions };
            })
        }));
    };

    const addQuizQuestion = () => {
        setQuizForm((current) => ({
            ...current,
            questions: [...current.questions, { ...defaultQuizQuestion, text: '' }]
        }));
    };

    const removeQuizQuestion = (questionIndex) => {
        setQuizForm((current) => ({
            ...current,
            questions: current.questions.length === 1
                ? current.questions
                : current.questions.filter((_, index) => index !== questionIndex)
        }));
    };

    const handleMarkAttendance = async (event) => {
        event.preventDefault();
        if (!classId || !attendanceForm.student) return;
        setError('');
        setSuccess('');
        try {
            await markAttendance({
                class: classId,
                user: attendanceForm.student,
                method: 'ONLINE_CLASS',
                attended: attendanceForm.attended,
                attendanceDate: attendanceForm.attendanceDate,
                note: attendanceForm.note
            });
            setAttendanceForm({ student: '', attended: true, attendanceDate: getTodayInputValue(), note: '' });
            await reloadDetails('Attendance saved.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot save attendance.');
        }
    };

    const handlePinComment = async (comment) => {
        setError('');
        setSuccess('');
        try {
            await pinClassComment(comment._id, !comment.pinned);
            await reloadDetails(comment.pinned ? 'Comment unpinned.' : 'Comment pinned.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot update discussion.');
        }
    };

    const handleSendClassNotification = async (event) => {
        event.preventDefault();
        if (!classId || !classNotificationForm.title.trim()) return;
        setError('');
        setSuccess('');
        try {
            const response = await sendClassNotification(classId, {
                title: classNotificationForm.title.trim(),
                message: classNotificationForm.message.trim()
            });
            setClassNotificationForm({ title: '', message: '' });
            setSuccess(`Notification sent to ${response.data.count || 0} students.`);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot send notification.');
        }
    };

    const paginate = (key, items, limit = 5) => createPagination(items, pages[key] || 1, limit);
    const setPage = (key, page) => setPages((current) => ({ ...current, [key]: page }));
    const pagedClassEnrollments = paginate('classEnrollments', classEnrollments, 10);
    const pagedChapters = paginate('chapters', chapters, 3);
    const pagedAssignments = paginate('assignments', assignments, 5);
    const pagedQuizzes = paginate('quizzes', quizzes, 5);
    const pagedAttendance = paginate('attendance', attendance, 10);
    const pagedComments = paginate('comments', comments, 5);

    const tabs = [
        ['classes', 'Classes'],
        ['content', 'Content'],
        ['assignments', 'Assignments'],
        ['quizzes', 'Quizzes'],
        ['attendance', 'Attendance'],
        ['notifications', 'Notifications'],
        ['discussion', 'Discussion']
    ];

    if (loading) {
        return <div className="container-fluid py-5 text-center text-muted fw-semibold">Loading teacher workspace...</div>;
    }

    return (
        <div className="container-fluid px-0 py-3">
            {/* Header Block */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 p-4 bg-white rounded-4 border">
                <div>
                    <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1.5 mb-2 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Teacher Console</span>
                    <h2 className="fw-bold mb-1 text-dark">Teaching Workspace</h2>
                    <p className="text-muted mb-0 small">Manage assigned classes, curriculums, submissions, attendance sheets, and student forums.</p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <label className="text-muted small fw-semibold mb-0 text-nowrap" htmlFor="teacher-class-select">Select Class:</label>
                    <select id="teacher-class-select" className="form-select py-2 rounded-3 bg-light border-0 fw-semibold text-dark w-auto" value={selectedClass?._id || ''} onChange={(event) => setSelectedClassId(event.target.value)}>
                        {classes.map((classItem) => (
                            <option key={classItem._id} value={classItem._id}>
                                {classItem.code} - {classItem.course?.title || 'Course'}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <div className="alert alert-danger py-2.5 mb-4">{error}</div>}
            {success && <div className="alert alert-success py-2.5 mb-4">{success}</div>}

            {classes.length === 0 ? (
                <div className="alert alert-secondary py-3 text-center rounded-3">No class is assigned to your account yet.</div>
            ) : (
                <>
                    {/* Summary Statistics Cards */}
                    <div className="row g-3 mb-4">
                        <div className="col-sm-6 col-xl-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                                <div className="bg-primary-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-primary" style={{ width: '56px', height: '56px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                </div>
                                <div>
                                    <span className="text-muted small fw-semibold text-uppercase d-block" style={{ letterSpacing: '0.04em', fontSize: '0.7rem' }}>Total Students</span>
                                    <strong className="text-dark fs-3 fw-bold">{students.length}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="col-sm-6 col-xl-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                                <div className="bg-success-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-success" style={{ width: '56px', height: '56px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a5 5 0 0 0-5 5v3c0 3.3 2.7 6 6 6s6-2.7 6-6V7a5 5 0 0 0-5-5z"/></svg>
                                </div>
                                <div>
                                    <span className="text-muted small fw-semibold text-uppercase d-block" style={{ letterSpacing: '0.04em', fontSize: '0.7rem' }}>Lessons count</span>
                                    <strong className="text-dark fs-3 fw-bold">{Object.values(lessonsByChapter).flat().length}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="col-sm-6 col-xl-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                                <div className="bg-warning-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-warning" style={{ width: '56px', height: '56px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                </div>
                                <div>
                                    <span className="text-muted small fw-semibold text-uppercase d-block" style={{ letterSpacing: '0.04em', fontSize: '0.7rem' }}>Assignments</span>
                                    <strong className="text-dark fs-3 fw-bold">{assignments.length}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="col-sm-6 col-xl-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                                <div className="bg-info-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-info" style={{ width: '56px', height: '56px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                                </div>
                                <div>
                                    <span className="text-muted small fw-semibold text-uppercase d-block" style={{ letterSpacing: '0.04em', fontSize: '0.7rem' }}>Attendance Sheets</span>
                                    <strong className="text-dark fs-3 fw-bold">{attendance.length}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section Tab pills bar */}
                    <div className="nav nav-pills gap-2 mb-4 border p-2 bg-white rounded-4" role="tablist">
                        {tabs.map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                className={`nav-link fw-semibold rounded-3 px-4 py-2 border-0 ${activeTab === key ? 'active bg-primary text-white shadow-sm' : 'text-muted bg-transparent'}`}
                                onClick={() => {
                                    setActiveTab(key);
                                    setPages({});
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* TAB CONTENT MODULES */}
                    <div className="tab-content">
                        {/* TAB: classes */}
                        {activeTab === 'classes' && (
                            <section className="card border-0 shadow-sm rounded-4 p-4">
                                <h4 className="fw-bold text-dark mb-4">Class Students</h4>
                                <div className="table-responsive rounded-3 border bg-white mb-2">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="ps-3">Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Status</th>
                                                <th className="pe-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pagedClassEnrollments.items.map((enrollment) => {
                                                const student = enrollment.user || {};
                                                const completed = enrollment.status === 'COMPLETED';
                                                return (
                                                    <tr key={enrollment._id}>
                                                        <td className="ps-3 fw-semibold text-dark">{student.fullName || '-'}</td>
                                                        <td>{student.email || '-'}</td>
                                                        <td>{student.phone || '-'}</td>
                                                        <td>
                                                            <span className={`badge px-2.5 py-1.5 rounded-2 ${getEnrollmentStatusBadgeClass(enrollment.status)}`}>
                                                                {getEnrollmentStatusLabel(enrollment.status)}
                                                            </span>
                                                            {enrollment.completedAt && <div className="small text-muted mt-1 font-monospace">{new Date(enrollment.completedAt).toLocaleDateString('vi-VN')}</div>}
                                                        </td>
                                                        <td className="pe-3">
                                                            <button
                                                                className="btn btn-sm btn-outline-success px-3 rounded-3 fw-semibold"
                                                                type="button"
                                                                onClick={() => handleApproveCompletion(enrollment)}
                                                                disabled={completed}
                                                            >
                                                                {completed ? 'Approved' : 'Mark completed'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {classEnrollments.length > 0 && <PaginationControls pagination={pagedClassEnrollments.pagination} onPageChange={(page) => setPage('classEnrollments', page)} itemLabel="students" />}
                            </section>
                        )}

                        {/* TAB: content */}
                        {activeTab === 'content' && (
                            <section className="row g-4">
                                <div className="col-lg-5 d-flex flex-column gap-4">
                                    {/* Create Chapter Form */}
                                    <div className="card border-0 shadow-sm rounded-4 p-4">
                                        <h4 className="fw-bold text-dark mb-4">Create Chapter</h4>
                                        <form className="row g-3" onSubmit={handleCreateChapter}>
                                            <div className="col-12">
                                                <label className="form-label small fw-semibold text-dark">Chapter Title</label>
                                                <input className="form-control bg-light border-0 py-2 rounded-3" placeholder="Chapter title..." value={chapterForm.title} onChange={(event) => setChapterForm((current) => ({ ...current, title: event.target.value }))} required />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-semibold text-dark">Description</label>
                                                <textarea className="form-control bg-light border-0 py-2 rounded-3" placeholder="Chapter description summary..." value={chapterForm.description} onChange={(event) => setChapterForm((current) => ({ ...current, description: event.target.value }))} rows="2" />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-semibold text-dark">Sort Order</label>
                                                <input className="form-control bg-light border-0 py-2 rounded-3" type="number" placeholder="Order" value={chapterForm.order} onChange={(event) => setChapterForm((current) => ({ ...current, order: event.target.value }))} />
                                            </div>
                                            <div className="col-12 mt-4 text-end">
                                                <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold auth-primary-btn" type="submit">Create Chapter</button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Create Lesson Form */}
                                    <div className="card border-0 shadow-sm rounded-4 p-4">
                                        <h4 className="fw-bold text-dark mb-4">Create Lesson</h4>
                                        <form className="row g-3" onSubmit={handleCreateLesson}>
                                            <div className="col-12">
                                                <label className="form-label small fw-semibold text-dark">Chapter Assignment</label>
                                                <select className="form-select bg-light border-0 py-2 rounded-3" value={selectedChapterId} onChange={(event) => setSelectedChapterId(event.target.value)}>
                                                    {chapters.map((chapter) => <option key={chapter._id} value={chapter._id}>{chapter.title}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-semibold text-dark">Lesson Title</label>
                                                <input className="form-control bg-light border-0 py-2 rounded-3" placeholder="Lesson title..." value={lessonForm.title} onChange={(event) => setLessonForm((current) => ({ ...current, title: event.target.value }))} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold text-dark">Content Type</label>
                                                <select className="form-select bg-light border-0 py-2 rounded-3" value={lessonForm.contentType} onChange={(event) => setLessonForm((current) => ({ ...current, contentType: event.target.value }))}>
                                                    {['VIDEO', 'PDF', 'DOCX', 'PPT', 'AUDIO', 'ARTICLE', 'ASSIGNMENT', 'QUIZ'].map((type) => <option key={type} value={type}>{type}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold text-dark">Order</label>
                                                <input className="form-control bg-light border-0 py-2 rounded-3" type="number" placeholder="Order" value={lessonForm.order} onChange={(event) => setLessonForm((current) => ({ ...current, order: event.target.value }))} />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-semibold text-dark">Content Resource URL</label>
                                                <input className="form-control bg-light border-0 py-2 rounded-3" placeholder="Paste YouTube link or direct resource URL" value={lessonForm.contentUrl} onChange={(event) => setLessonForm((current) => ({ ...current, contentUrl: event.target.value }))} />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-semibold text-dark">Upload Material File</label>
                                                <input
                                                    key={lessonFile ? lessonFile.name : 'lesson-file-empty'}
                                                    className="form-control bg-light border-0 py-2 rounded-3"
                                                    type="file"
                                                    accept=".mp4,.webm,.mp3,.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                                                    onChange={(event) => setLessonFile(event.target.files?.[0] || null)}
                                                />
                                                <small className="text-muted">For VIDEO, paste a YouTube link or upload MP4/WEBM. Documents are saved locally and opened only from Open / Download.</small>
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-semibold text-dark">Description</label>
                                                <textarea className="form-control bg-light border-0 py-2 rounded-3" placeholder="Lesson summary details..." value={lessonForm.description} onChange={(event) => setLessonForm((current) => ({ ...current, description: event.target.value }))} rows="2" />
                                            </div>
                                            <div className="col-12 mt-4 text-end">
                                                <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold auth-primary-btn" type="submit">Create Lesson</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                <div className="col-lg-7">
                                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                        <h4 className="fw-bold text-dark mb-4">Lessons and Materials</h4>
                                        {pagedChapters.items.map((chapter) => (
                                            <div key={chapter._id} className="p-3 border rounded-4 bg-light mb-4">
                                                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                                    <h6 className="fw-bold text-dark mb-0">{chapter.title}</h6>
                                                    <button className="btn btn-sm btn-outline-secondary px-3 rounded-2 fw-semibold" type="button" onClick={() => handleReorderChapterLessons(chapter._id)} disabled={(lessonsByChapter[chapter._id] || []).length < 2}>
                                                        Normalize order
                                                    </button>
                                                </div>
                                                <div className="d-flex flex-column gap-3">
                                                    {(lessonsByChapter[chapter._id] || []).length === 0 ? (
                                                        <p className="text-muted small mb-0">No lessons are available inside this chapter yet.</p>
                                                    ) : (
                                                        (lessonsByChapter[chapter._id] || []).map((lesson) => (
                                                            <div key={lesson._id} className="p-3 border rounded-3 bg-white">
                                                                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                                                                    <div>
                                                                        <div className="fw-bold text-dark small mb-0.5">{lesson.title}</div>
                                                                        <div className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                                                                            Type: {lesson.contentType} | Order: {lesson.order ?? 0}
                                                                        </div>
                                                                    </div>
                                                                    <div className="d-flex gap-2">
                                                                        <button className="btn btn-sm btn-outline-secondary px-2.5 rounded-2" type="button" onClick={() => handleDeleteMaterial(lesson._id)} disabled={!lesson.contentUrl}>
                                                                            Remove material
                                                                        </button>
                                                                        <button className="btn btn-sm btn-outline-danger px-2.5 rounded-2" type="button" onClick={() => handleDeleteLesson(lesson._id)}>
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="input-group mt-3">
                                                                    <input className="form-control form-control-sm bg-light border-0 py-1.5" type="file" onChange={(event) => setMaterialFileByLesson((current) => ({ ...current, [lesson._id]: event.target.files?.[0] }))} />
                                                                    <button className="btn btn-sm btn-outline-primary px-3 fw-bold" type="button" onClick={() => handleUploadMaterial(lesson._id)} disabled={!materialFileByLesson[lesson._id]}>
                                                                        Upload
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {chapters.length > 0 && <PaginationControls pagination={pagedChapters.pagination} onPageChange={(page) => setPage('chapters', page)} itemLabel="chapters" />}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* TAB: assignments */}
                        {activeTab === 'assignments' && (
                            <section className="row g-4">
                                <div className="col-lg-4">
                                    <div className="card border-0 shadow-sm rounded-4 p-4">
                                        <h4 className="fw-bold text-dark mb-4">{editingAssignmentId ? 'Update Assignment' : 'Create Assignment'}</h4>
                                        <form className="row g-3" onSubmit={handleSaveAssignment}>
                                            <div className="col-12">
                                                <label className="form-label small fw-semibold text-dark">Assignment Title</label>
                                                <input className="form-control bg-light border-0 py-2 rounded-3" placeholder="Assignment title..." value={assignmentForm.title} onChange={(event) => setAssignmentForm((current) => ({ ...current, title: event.target.value }))} required />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-semibold text-dark">Instructions</label>
                                                <textarea className="form-control bg-light border-0 py-2 rounded-3" placeholder="Student instructions..." value={assignmentForm.description} onChange={(event) => setAssignmentForm((current) => ({ ...current, description: event.target.value }))} rows="3" />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-semibold text-dark">Due Date</label>
                                                <input className="form-control bg-light border-0 py-2 rounded-3" type="date" value={assignmentForm.dueDate} onChange={(event) => setAssignmentForm((current) => ({ ...current, dueDate: event.target.value }))} />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-semibold text-dark">Max Score</label>
                                                <input className="form-control bg-light border-0 py-2 rounded-3" type="number" value={assignmentForm.maxScore} onChange={(event) => setAssignmentForm((current) => ({ ...current, maxScore: event.target.value }))} />
                                            </div>
                                            <div className="col-12 mt-4 d-flex gap-2 justify-content-end">
                                                {editingAssignmentId && <button className="btn btn-outline-secondary px-3 py-2 rounded-3 fw-bold" type="button" onClick={() => { setEditingAssignmentId(''); setAssignmentForm(emptyAssignment); }}>Cancel</button>}
                                                <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold auth-primary-btn" type="submit">{editingAssignmentId ? 'Update' : 'Create'}</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                <div className="col-lg-8">
                                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                        <h4 className="fw-bold text-dark mb-4">Submissions and Grading</h4>
                                        <div className="d-flex flex-column gap-3.5">
                                            {pagedAssignments.items.map((assignment) => (
                                                <div key={assignment._id} className="p-3 border rounded-4 bg-light">
                                                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 pb-3 border-bottom mb-3">
                                                        <div>
                                                            <h6 className="fw-bold text-dark mb-1">{assignment.title}</h6>
                                                            <small className="text-muted">Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('vi-VN') : 'No due date'}</small>
                                                        </div>
                                                        <span className="d-flex align-items-center gap-2">
                                                            <span className="badge bg-white border text-secondary px-2.5 py-1.5 rounded-2 font-monospace fw-bold">
                                                                Graded: {analyticsByAssignment[assignment._id]?.gradedSubmissions || 0}/{analyticsByAssignment[assignment._id]?.totalSubmissions || 0}
                                                            </span>
                                                            <button className="btn btn-sm btn-outline-primary px-3 rounded-2 fw-semibold" type="button" onClick={() => startEditAssignment(assignment)}>Edit</button>
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="d-flex flex-column gap-3">
                                                        {(submissionsByAssignment[assignment._id] || []).length === 0 ? (
                                                            <p className="text-muted small mb-0">No submissions from class students yet.</p>
                                                        ) : (
                                                            (submissionsByAssignment[assignment._id] || []).map((submission) => {
                                                                const form = gradeForm[submission._id] || {};
                                                                return (
                                                                    <div key={submission._id} className="border rounded-3 p-3 bg-white">
                                                                        <div className="d-flex justify-content-between align-items-center mb-1.5">
                                                                            <span className="fw-bold text-dark small">{submission.student?.fullName || 'Student'}</span>
                                                                            <span className={`badge px-2 py-1 rounded-2 ${submission.status === 'GRADED' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                                                                                {submission.status}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-muted small mb-3 text-break">{submission.content || submission.fileUrl || 'No content details provided.'}</p>
                                                                        
                                                                        <div className="row g-2 align-items-center pt-2 border-top">
                                                                            <div className="col-md-3">
                                                                                <input className="form-control form-control-sm bg-light border-0 py-1.5" type="number" placeholder="Score" value={form.score || ''} onChange={(event) => setGradeForm((current) => ({ ...current, [submission._id]: { ...form, score: event.target.value } }))} />
                                                                            </div>
                                                                            <div className="col-md-6">
                                                                                <input className="form-control form-control-sm bg-light border-0 py-1.5" placeholder="Teacher feedback note..." value={form.feedback || ''} onChange={(event) => setGradeForm((current) => ({ ...current, [submission._id]: { ...form, feedback: event.target.value } }))} />
                                                                            </div>
                                                                            <div className="col-md-3">
                                                                                <button className="btn btn-sm btn-outline-primary w-100 py-1.5 fw-bold" type="button" onClick={() => handleGrade(submission._id, assignment._id)} disabled={form.score === undefined || form.score === ''}>
                                                                                    Grade
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {assignments.length > 0 && <div className="mt-4"><PaginationControls pagination={pagedAssignments.pagination} onPageChange={(page) => setPage('assignments', page)} itemLabel="assignments" /></div>}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* TAB: quizzes */}
                        {activeTab === 'quizzes' && (
                            <section className="row g-4">
                                <div className="col-lg-5">
                                    <div className="card border-0 shadow-sm rounded-4 p-4">
                                        <h4 className="fw-bold text-dark mb-4">{editingQuizId ? 'Update Quiz' : 'Create Quiz'}</h4>
                                        <form className="row g-3" onSubmit={handleSaveQuiz}>
                                            <div className="col-12">
                                                <label className="form-label small fw-semibold text-dark">Quiz Title</label>
                                                <input className="form-control bg-light border-0 py-2 rounded-3" placeholder="Quiz title..." value={quizForm.title} onChange={(event) => setQuizForm((current) => ({ ...current, title: event.target.value }))} required />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-semibold text-dark">Time Limit (mins)</label>
                                                <input className="form-control bg-light border-0 py-2 rounded-3 text-center" type="number" value={quizForm.durationMinutes} onChange={(event) => setQuizForm((current) => ({ ...current, durationMinutes: event.target.value }))} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-semibold text-dark">Pass Score (%)</label>
                                                <input className="form-control bg-light border-0 py-2 rounded-3 text-center" type="number" value={quizForm.passScore} onChange={(event) => setQuizForm((current) => ({ ...current, passScore: event.target.value }))} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small fw-semibold text-dark">Max Attempts</label>
                                                <input className="form-control bg-light border-0 py-2 rounded-3 text-center" type="number" value={quizForm.maxAttempts} onChange={(event) => setQuizForm((current) => ({ ...current, maxAttempts: event.target.value }))} />
                                            </div>

                                            <div className="col-12 border-top pt-3 mt-3">
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <h5 className="fw-bold text-dark mb-0 fs-6">Questions</h5>
                                                    <button className="btn btn-sm btn-outline-primary px-3 rounded-2 fw-semibold" type="button" onClick={addQuizQuestion}>Add question</button>
                                                </div>
                                                <div className="d-flex flex-column gap-3" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                                                    {quizForm.questions.map((question, questionIndex) => (
                                                        <div className="border rounded-4 p-3 bg-light" key={`question-${questionIndex}`}>
                                                            <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                                                                <strong className="text-dark small">Question {questionIndex + 1}</strong>
                                                                <button className="btn btn-sm btn-outline-danger px-2 py-0.5 rounded-2" type="button" onClick={() => removeQuizQuestion(questionIndex)} disabled={quizForm.questions.length === 1}>Remove</button>
                                                            </div>
                                                            <div className="row g-3">
                                                                <div className="col-12">
                                                                    <input className="form-control form-control-sm bg-white" placeholder="Question text description..." value={question.text} onChange={(event) => updateQuizQuestion(questionIndex, { text: event.target.value })} required />
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <select className="form-select form-select-sm bg-white" value={question.type} onChange={(event) => updateQuizQuestion(questionIndex, { type: event.target.value })}>
                                                                        <option value="MULTIPLE_CHOICE">Multiple choice</option>
                                                                        <option value="ESSAY">Essay</option>
                                                                    </select>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <input className="form-control form-control-sm bg-white text-center" type="number" min="1" placeholder="Points" value={question.points} onChange={(event) => updateQuizQuestion(questionIndex, { points: event.target.value })} />
                                                                </div>
                                                                {question.type !== 'ESSAY' && (
                                                                    <>
                                                                        {question.options.map((option, optionIndex) => {
                                                                            const optionKey = String.fromCharCode(65 + optionIndex);
                                                                            return (
                                                                                <div className="col-md-6" key={`${questionIndex}-${optionKey}`}>
                                                                                    <div className="input-group input-group-sm">
                                                                                        <span className="input-group-text bg-white border-end-0 text-muted fw-bold">{optionKey}</span>
                                                                                        <input className="form-control border-start-0" value={option} onChange={(event) => updateQuizOption(questionIndex, optionIndex, event.target.value)} />
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                        <div className="col-12">
                                                                            <label className="form-label small text-muted mb-1">Correct answer option</label>
                                                                            <select className="form-select form-select-sm bg-white" value={question.correctAnswer} onChange={(event) => updateQuizQuestion(questionIndex, { correctAnswer: event.target.value })}>
                                                                                {question.options.map((_, optionIndex) => {
                                                                                    const optionKey = String.fromCharCode(65 + optionIndex);
                                                                                    return <option key={optionKey} value={optionKey}>{optionKey}</option>;
                                                                                })}
                                                                            </select>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="col-12 mt-4 d-flex gap-2 justify-content-end border-top pt-3">
                                                {editingQuizId && (
                                                    <button className="btn btn-outline-secondary px-3 py-2 rounded-3 fw-bold" type="button" onClick={() => {
                                                        setEditingQuizId('');
                                                        setQuizForm({
                                                            title: '',
                                                            durationMinutes: 30,
                                                            passScore: 70,
                                                            maxAttempts: 1,
                                                            questions: [defaultQuizQuestion]
                                                        });
                                                    }}>Cancel</button>
                                                )}
                                                <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold auth-primary-btn" type="submit">{editingQuizId ? 'Update' : 'Create'}</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                <div className="col-lg-7">
                                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                        <h4 className="fw-bold text-dark mb-4">Class Quizzes</h4>
                                        <div className="d-flex flex-column gap-3">
                                            {quizzes.length === 0 ? (
                                                <p className="text-muted small mb-0">No quizzes are registered for this class.</p>
                                            ) : (
                                                pagedQuizzes.items.map((quiz) => (
                                                    <div className="p-3 border rounded-3 bg-white d-flex justify-content-between align-items-center gap-3" key={quiz._id}>
                                                        <div>
                                                            <strong className="text-dark small d-block mb-0.5">{quiz.title}</strong>
                                                            <span className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                                                                {quiz.questions?.length || 0} Questions | {quiz.durationMinutes || 0} minutes duration limit
                                                            </span>
                                                        </div>
                                                        <button className="btn btn-sm btn-outline-primary px-3 rounded-2 fw-semibold" type="button" onClick={() => startEditQuiz(quiz)}>
                                                            Edit
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        {quizzes.length > 0 && <div className="mt-4"><PaginationControls pagination={pagedQuizzes.pagination} onPageChange={(page) => setPage('quizzes', page)} itemLabel="quizzes" /></div>}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* TAB: attendance */}
                        {activeTab === 'attendance' && (
                            <section className="card border-0 shadow-sm rounded-4 p-4">
                                <h4 className="fw-bold text-dark mb-4">Attendance management</h4>
                                <form className="row g-3 mb-4 p-3 bg-light rounded-4 border" onSubmit={handleMarkAttendance}>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-semibold text-dark mb-1">Student select</label>
                                        <select className="form-select bg-white py-2 rounded-3" value={attendanceForm.student} onChange={(event) => setAttendanceForm((current) => ({ ...current, student: event.target.value }))} required>
                                            <option value="">Choose student...</option>
                                            {students.map((student) => <option key={student._id} value={student._id}>{student.fullName}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <label className="form-label small fw-semibold text-dark mb-1">Date</label>
                                        <input className="form-control bg-white py-2 rounded-3" type="date" value={attendanceForm.attendanceDate} onChange={(event) => setAttendanceForm((current) => ({ ...current, attendanceDate: event.target.value }))} required />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-semibold text-dark mb-1">Attended status</label>
                                        <select className="form-select bg-white py-2 rounded-3" value={String(attendanceForm.attended)} onChange={(event) => setAttendanceForm((current) => ({ ...current, attended: event.target.value === 'true' }))}>
                                            <option value="true">Attended</option>
                                            <option value="false">Missing</option>
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-semibold text-dark mb-1">Attendance note</label>
                                        <input className="form-control bg-white py-2 rounded-3" placeholder="Attendance note details..." value={attendanceForm.note} onChange={(event) => setAttendanceForm((current) => ({ ...current, note: event.target.value }))} />
                                    </div>
                                    <div className="col-md-2 d-flex align-items-end">
                                        <button className="btn btn-primary w-100 py-2 rounded-3 fw-bold auth-primary-btn" type="submit">Save attendance</button>
                                    </div>
                                </form>
                                
                                <div className="table-responsive rounded-3 border bg-white mb-2">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="ps-3">Student Name</th>
                                                <th>Date</th>
                                                <th>Lesson Title</th>
                                                <th>Attended Status</th>
                                                <th className="pe-3">Note Details</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pagedAttendance.items.map((item) => (
                                                <tr key={item._id}>
                                                    <td className="ps-3 fw-semibold text-dark">{item.user?.fullName || '-'}</td>
                                                    <td className="text-muted small">{formatAttendanceDate(item)}</td>
                                                    <td>{item.lesson?.title || '-'}</td>
                                                    <td>
                                                        <span className={`badge px-2.5 py-1.5 rounded-2 ${item.attended ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                            {item.attended ? 'Attended' : 'Missing'}
                                                        </span>
                                                    </td>
                                                    <td className="pe-3 text-muted small">{item.note || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {attendance.length > 0 && <PaginationControls pagination={pagedAttendance.pagination} onPageChange={(page) => setPage('attendance', page)} itemLabel="attendance records" />}
                            </section>
                        )}

                        {/* TAB: notifications */}
                        {activeTab === 'notifications' && (
                            <section className="card border-0 shadow-sm rounded-4 p-4">
                                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                                    <div>
                                        <h4 className="fw-bold text-dark mb-1">Class notifications</h4>
                                        <p className="text-muted small mb-0">
                                            Send realtime notifications to students in {selectedClass?.code || 'the selected class'}.
                                        </p>
                                    </div>
                                    <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
                                        {students.length} students
                                    </span>
                                </div>
                                <form className="row g-3 p-3 bg-light rounded-4 border" onSubmit={handleSendClassNotification}>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-semibold text-dark mb-1">Title</label>
                                        <input
                                            className="form-control bg-white py-2 rounded-3"
                                            placeholder="Notification title"
                                            value={classNotificationForm.title}
                                            onChange={(event) => setClassNotificationForm((current) => ({ ...current, title: event.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold text-dark mb-1">Message</label>
                                        <input
                                            className="form-control bg-white py-2 rounded-3"
                                            placeholder="Message to students..."
                                            value={classNotificationForm.message}
                                            onChange={(event) => setClassNotificationForm((current) => ({ ...current, message: event.target.value }))}
                                        />
                                    </div>
                                    <div className="col-md-2 d-flex align-items-end">
                                        <button className="btn btn-primary w-100 py-2 rounded-3 fw-bold auth-primary-btn" type="submit" disabled={!classId || students.length === 0}>
                                            Send
                                        </button>
                                    </div>
                                </form>
                            </section>
                        )}

                        {/* TAB: discussion */}
                        {activeTab === 'discussion' && (
                            <section className="card border-0 shadow-sm rounded-4 p-4">
                                <h4 className="fw-bold text-dark mb-4">Discussion Moderation</h4>
                                <div className="d-flex flex-column gap-3">
                                    {comments.length === 0 ? (
                                        <p className="text-muted small mb-0">No discussion threads found in this class.</p>
                                    ) : (
                                        pagedComments.items.map((comment) => (
                                            <div className="p-3 border rounded-3 bg-white d-flex justify-content-between align-items-center gap-3" key={comment._id}>
                                                <div>
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <strong className="text-dark small">{comment.title || 'Discussion'}</strong>
                                                        {comment.pinned && <span className="badge bg-primary rounded-pill" style={{ fontSize: '0.65rem' }}>Pinned</span>}
                                                    </div>
                                                    <p className="mb-2 text-muted small">{comment.content}</p>
                                                    <small className="badge bg-light text-secondary rounded-2 px-2 py-1 fw-bold">{comment.author?.fullName || 'Member'}</small>
                                                </div>
                                                <button className="btn btn-sm btn-outline-primary px-3 rounded-2 fw-semibold" type="button" onClick={() => handlePinComment(comment)}>
                                                    {comment.pinned ? 'Unpin thread' : 'Pin thread'}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {comments.length > 0 && <div className="mt-4"><PaginationControls pagination={pagedComments.pagination} onPageChange={(page) => setPage('comments', page)} itemLabel="comments" /></div>}
                            </section>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TeacherDashboard;

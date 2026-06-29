import { useCallback, useEffect, useMemo, useState } from 'react';
import { createAssignment, getAssignments, getAssignmentSubmissions, gradeSubmission, updateAssignment } from '../services/assignment';
import { getAttendance, markAttendance } from '../services/attendance';
import { createChapter, getChaptersByClass } from '../services/chapter';
import { getClassComments, pinClassComment } from '../services/discussion';
import { createLesson, deleteLesson, deleteLessonMaterial, getLessonsByChapter, reorderLessons, uploadLessonMedia } from '../services/lesson';
import { createQuiz, getQuizzesByClass, updateQuiz } from '../services/quiz';
import { approveCourseCompletion, getAssignmentAnalytics, getTeacherClasses, getTeacherClassStudents } from '../services/teacher';
import PaginationControls from '../components/PaginationControls';
import { createPagination } from '../utils/pagination';

const getId = (value) => value?._id || value || '';

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
    const [attendanceForm, setAttendanceForm] = useState({ student: '', attended: true, note: '' });
    const [pages, setPages] = useState({});
    const [activeTab, setActiveTab] = useState('classes');
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
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

        setDetailLoading(true);
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
        } finally {
            setDetailLoading(false);
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
        try {
            await createLesson({
                ...lessonForm,
                chapter: selectedChapterId,
                durationMinutes: Number(lessonForm.durationMinutes || 0),
                order: Number(lessonForm.order || 0)
            });
            setLessonForm(emptyLesson);
            await reloadDetails('Lesson created.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot create lesson.');
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
            setError(requestError.response?.data?.message || 'Cannot upload material.');
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
                note: attendanceForm.note
            });
            setAttendanceForm({ student: '', attended: true, note: '' });
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
        ['discussion', 'Discussion']
    ];

    if (loading) {
        return <div className="container py-5">Loading teacher workspace...</div>;
    }

    return (
        <div className="container py-5">
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
                <div>
                    <span className="eyebrow">Teacher</span>
                    <h2>Teaching workspace</h2>
                    <p className="text-muted mb-0">Manage assigned classes, content, submissions, attendance, and class discussion.</p>
                </div>
                <select className="form-select w-auto" value={selectedClass?._id || ''} onChange={(event) => setSelectedClassId(event.target.value)}>
                    {classes.map((classItem) => (
                        <option key={classItem._id} value={classItem._id}>
                            {classItem.code} - {classItem.course?.title || 'Course'}
                        </option>
                    ))}
                </select>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {classes.length === 0 ? (
                <div className="alert alert-secondary">No class is assigned to your account yet.</div>
            ) : (
                <>
                    <div className="row gy-4 mb-4">
                        <div className="col-md-3"><div className="card p-4"><span>Students</span><strong>{students.length}</strong></div></div>
                        <div className="col-md-3"><div className="card p-4"><span>Lessons</span><strong>{Object.values(lessonsByChapter).flat().length}</strong></div></div>
                        <div className="col-md-3"><div className="card p-4"><span>Assignments</span><strong>{assignments.length}</strong></div></div>
                        <div className="col-md-3"><div className="card p-4"><span>Attendance</span><strong>{attendance.length}</strong></div></div>
                    </div>

                    <div className="btn-group flex-wrap mb-4" role="group" aria-label="Teacher sections">
                        {tabs.map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                className={`btn ${activeTab === key ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => {
                                    setActiveTab(key);
                                    setPages({});
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {detailLoading && <div className="alert alert-info">Loading class details...</div>}

                    {activeTab === 'classes' && (
                        <section className="card p-4">
                            <h4>Class students</h4>
                            <div className="table-responsive">
                                <table className="table align-middle">
                                    <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Progress</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {pagedClassEnrollments.items.map((enrollment) => {
                                            const student = enrollment.user || {};
                                            const completed = enrollment.status === 'COMPLETED';
                                            return (
                                                <tr key={enrollment._id}>
                                                    <td>{student.fullName || '-'}</td>
                                                    <td>{student.email || '-'}</td>
                                                    <td>{student.phone || '-'}</td>
                                                    <td>{enrollment.progress || 0}%</td>
                                                    <td>
                                                        <span className={`badge ${completed ? 'text-bg-success' : 'text-bg-light'}`}>
                                                            {completed ? 'COMPLETED' : enrollment.status}
                                                        </span>
                                                        {enrollment.completedAt && <div className="small text-muted">{new Date(enrollment.completedAt).toLocaleDateString('vi-VN')}</div>}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-outline-success"
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

                    {activeTab === 'content' && (
                        <section className="row gy-4">
                            <div className="col-lg-5">
                                <div className="card p-4 mb-4">
                                    <h4>Create chapter</h4>
                                    <form className="row gy-3" onSubmit={handleCreateChapter}>
                                        <div className="col-12"><input className="form-control" placeholder="Chapter title" value={chapterForm.title} onChange={(event) => setChapterForm((current) => ({ ...current, title: event.target.value }))} required /></div>
                                        <div className="col-12"><textarea className="form-control" placeholder="Description" value={chapterForm.description} onChange={(event) => setChapterForm((current) => ({ ...current, description: event.target.value }))} /></div>
                                        <div className="col-12"><input className="form-control" type="number" placeholder="Order" value={chapterForm.order} onChange={(event) => setChapterForm((current) => ({ ...current, order: event.target.value }))} /></div>
                                        <div className="col-12"><button className="btn btn-primary" type="submit">Create chapter</button></div>
                                    </form>
                                </div>

                                <div className="card p-4">
                                    <h4>Create lesson</h4>
                                    <form className="row gy-3" onSubmit={handleCreateLesson}>
                                        <div className="col-12">
                                            <select className="form-select" value={selectedChapterId} onChange={(event) => setSelectedChapterId(event.target.value)}>
                                                {chapters.map((chapter) => <option key={chapter._id} value={chapter._id}>{chapter.title}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-12"><input className="form-control" placeholder="Lesson title" value={lessonForm.title} onChange={(event) => setLessonForm((current) => ({ ...current, title: event.target.value }))} required /></div>
                                        <div className="col-md-6">
                                            <select className="form-select" value={lessonForm.contentType} onChange={(event) => setLessonForm((current) => ({ ...current, contentType: event.target.value }))}>
                                                {['VIDEO', 'PDF', 'DOCX', 'PPT', 'AUDIO', 'ARTICLE', 'ASSIGNMENT', 'QUIZ'].map((type) => <option key={type} value={type}>{type}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-md-6"><input className="form-control" type="number" placeholder="Order" value={lessonForm.order} onChange={(event) => setLessonForm((current) => ({ ...current, order: event.target.value }))} /></div>
                                        <div className="col-12"><input className="form-control" placeholder="Content URL" value={lessonForm.contentUrl} onChange={(event) => setLessonForm((current) => ({ ...current, contentUrl: event.target.value }))} /></div>
                                        <div className="col-12"><textarea className="form-control" placeholder="Description" value={lessonForm.description} onChange={(event) => setLessonForm((current) => ({ ...current, description: event.target.value }))} /></div>
                                        <div className="col-12"><button className="btn btn-primary" type="submit">Create lesson</button></div>
                                    </form>
                                </div>
                            </div>
                            <div className="col-lg-7">
                                <div className="card p-4">
                                    <h4>Lessons and materials</h4>
                                    {pagedChapters.items.map((chapter) => (
                                        <div key={chapter._id} className="mb-4">
                                            <div className="d-flex justify-content-between align-items-center gap-2">
                                                <h6>{chapter.title}</h6>
                                                <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => handleReorderChapterLessons(chapter._id)} disabled={(lessonsByChapter[chapter._id] || []).length < 2}>Normalize order</button>
                                            </div>
                                            {(lessonsByChapter[chapter._id] || []).map((lesson) => (
                                                <div key={lesson._id} className="border-top py-3">
                                                    <div className="d-flex flex-wrap justify-content-between gap-2">
                                                        <div>
                                                            <strong>{lesson.title}</strong>
                                                            <div className="text-muted">{lesson.contentType} - order {lesson.order ?? 0}</div>
                                                        </div>
                                                        <span className="d-flex gap-2">
                                                            <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => handleDeleteMaterial(lesson._id)} disabled={!lesson.contentUrl}>Remove material</button>
                                                            <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => handleDeleteLesson(lesson._id)}>Delete</button>
                                                        </span>
                                                    </div>
                                                    <div className="input-group mt-2">
                                                        <input className="form-control" type="file" onChange={(event) => setMaterialFileByLesson((current) => ({ ...current, [lesson._id]: event.target.files?.[0] }))} />
                                                        <button className="btn btn-outline-primary" type="button" onClick={() => handleUploadMaterial(lesson._id)} disabled={!materialFileByLesson[lesson._id]}>Upload</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                    {chapters.length > 0 && <PaginationControls pagination={pagedChapters.pagination} onPageChange={(page) => setPage('chapters', page)} itemLabel="chapters" />}
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'assignments' && (
                        <section className="row gy-4">
                            <div className="col-lg-4">
                                <div className="card p-4">
                                    <h4>{editingAssignmentId ? 'Update assignment' : 'Create assignment'}</h4>
                                    <form className="row gy-3" onSubmit={handleSaveAssignment}>
                                        <div className="col-12"><input className="form-control" placeholder="Title" value={assignmentForm.title} onChange={(event) => setAssignmentForm((current) => ({ ...current, title: event.target.value }))} required /></div>
                                        <div className="col-12"><textarea className="form-control" placeholder="Description" value={assignmentForm.description} onChange={(event) => setAssignmentForm((current) => ({ ...current, description: event.target.value }))} /></div>
                                        <div className="col-12"><input className="form-control" type="date" value={assignmentForm.dueDate} onChange={(event) => setAssignmentForm((current) => ({ ...current, dueDate: event.target.value }))} /></div>
                                        <div className="col-12"><input className="form-control" type="number" value={assignmentForm.maxScore} onChange={(event) => setAssignmentForm((current) => ({ ...current, maxScore: event.target.value }))} /></div>
                                        <div className="col-12 d-flex gap-2">
                                            <button className="btn btn-primary" type="submit">{editingAssignmentId ? 'Update assignment' : 'Create assignment'}</button>
                                            {editingAssignmentId && <button className="btn btn-outline-secondary" type="button" onClick={() => { setEditingAssignmentId(''); setAssignmentForm(emptyAssignment); }}>Cancel</button>}
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <div className="col-lg-8">
                                <div className="card p-4">
                                    <h4>Submissions and grading</h4>
                                    {pagedAssignments.items.map((assignment) => (
                                        <div key={assignment._id} className="border-top py-3">
                                            <div className="d-flex justify-content-between gap-3">
                                                <strong>{assignment.title}</strong>
                                                <span className="d-flex align-items-center gap-2">
                                                    <span className="badge text-bg-light">
                                                        {analyticsByAssignment[assignment._id]?.gradedSubmissions || 0}/{analyticsByAssignment[assignment._id]?.totalSubmissions || 0} graded
                                                    </span>
                                                    <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => startEditAssignment(assignment)}>Edit</button>
                                                </span>
                                            </div>
                                            {(submissionsByAssignment[assignment._id] || []).map((submission) => {
                                                const form = gradeForm[submission._id] || {};
                                                return (
                                                    <div key={submission._id} className="border rounded p-3 mt-2">
                                                        <div className="fw-semibold">{submission.student?.fullName || 'Student'} - {submission.status}</div>
                                                        <p className="text-muted">{submission.content || submission.fileUrl || 'No content'}</p>
                                                        <div className="row gy-2">
                                                            <div className="col-md-3"><input className="form-control" type="number" placeholder="Score" value={form.score || ''} onChange={(event) => setGradeForm((current) => ({ ...current, [submission._id]: { ...form, score: event.target.value } }))} /></div>
                                                            <div className="col-md-6"><input className="form-control" placeholder="Feedback" value={form.feedback || ''} onChange={(event) => setGradeForm((current) => ({ ...current, [submission._id]: { ...form, feedback: event.target.value } }))} /></div>
                                                            <div className="col-md-3"><button className="btn btn-outline-primary w-100" type="button" onClick={() => handleGrade(submission._id, assignment._id)} disabled={form.score === undefined || form.score === ''}>Grade</button></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                    {assignments.length > 0 && <PaginationControls pagination={pagedAssignments.pagination} onPageChange={(page) => setPage('assignments', page)} itemLabel="assignments" />}
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'quizzes' && (
                        <section className="row gy-4">
                            <div className="col-lg-5">
                                <div className="card p-4">
                                    <h4>{editingQuizId ? 'Update quiz' : 'Create quiz'}</h4>
                                    <form className="row gy-3" onSubmit={handleSaveQuiz}>
                                        <div className="col-12"><input className="form-control" placeholder="Quiz title" value={quizForm.title} onChange={(event) => setQuizForm((current) => ({ ...current, title: event.target.value }))} required /></div>
                                        <div className="col-md-4"><input className="form-control" type="number" value={quizForm.durationMinutes} onChange={(event) => setQuizForm((current) => ({ ...current, durationMinutes: event.target.value }))} /></div>
                                        <div className="col-md-4"><input className="form-control" type="number" value={quizForm.passScore} onChange={(event) => setQuizForm((current) => ({ ...current, passScore: event.target.value }))} /></div>
                                        <div className="col-md-4"><input className="form-control" type="number" value={quizForm.maxAttempts} onChange={(event) => setQuizForm((current) => ({ ...current, maxAttempts: event.target.value }))} /></div>
                                        <div className="col-12">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h5 className="mb-0">Questions</h5>
                                                <button className="btn btn-sm btn-outline-primary" type="button" onClick={addQuizQuestion}>Add question</button>
                                            </div>
                                            {quizForm.questions.map((question, questionIndex) => (
                                                <div className="border rounded p-3 mb-3" key={`question-${questionIndex}`}>
                                                    <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                                                        <strong>Question {questionIndex + 1}</strong>
                                                        <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => removeQuizQuestion(questionIndex)} disabled={quizForm.questions.length === 1}>Remove</button>
                                                    </div>
                                                    <div className="row gy-3">
                                                        <div className="col-12">
                                                            <input className="form-control" placeholder="Question text" value={question.text} onChange={(event) => updateQuizQuestion(questionIndex, { text: event.target.value })} required />
                                                        </div>
                                                        <div className="col-md-6">
                                                            <select className="form-select" value={question.type} onChange={(event) => updateQuizQuestion(questionIndex, { type: event.target.value })}>
                                                                <option value="MULTIPLE_CHOICE">Multiple choice</option>
                                                                <option value="ESSAY">Essay</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <input className="form-control" type="number" min="1" placeholder="Points" value={question.points} onChange={(event) => updateQuizQuestion(questionIndex, { points: event.target.value })} />
                                                        </div>
                                                        {question.type !== 'ESSAY' && (
                                                            <>
                                                                {question.options.map((option, optionIndex) => {
                                                                    const optionKey = String.fromCharCode(65 + optionIndex);
                                                                    return (
                                                                        <div className="col-md-6" key={`${questionIndex}-${optionKey}`}>
                                                                            <label className="form-label">{optionKey}</label>
                                                                            <input className="form-control" value={option} onChange={(event) => updateQuizOption(questionIndex, optionIndex, event.target.value)} />
                                                                        </div>
                                                                    );
                                                                })}
                                                                <div className="col-12">
                                                                    <label className="form-label">Correct answer</label>
                                                                    <select className="form-select" value={question.correctAnswer} onChange={(event) => updateQuizQuestion(questionIndex, { correctAnswer: event.target.value })}>
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
                                        <div className="col-12 d-flex gap-2">
                                            <button className="btn btn-primary" type="submit">{editingQuizId ? 'Update quiz' : 'Create quiz'}</button>
                                            {editingQuizId && <button className="btn btn-outline-secondary" type="button" onClick={() => {
                                                setEditingQuizId('');
                                                setQuizForm({
                                                    title: '',
                                                    durationMinutes: 30,
                                                    passScore: 70,
                                                    maxAttempts: 1,
                                                    questions: [defaultQuizQuestion]
                                                });
                                            }}>Cancel</button>}
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <div className="col-lg-7">
                                <div className="card p-4">
                                    <h4>Class quizzes</h4>
                                    {quizzes.length === 0 ? <p className="text-muted">No quiz yet.</p> : pagedQuizzes.items.map((quiz) => (
                                        <div className="border-top py-2" key={quiz._id}>
                                            <div className="d-flex justify-content-between gap-3">
                                                <strong>{quiz.title}</strong>
                                                <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => startEditQuiz(quiz)}>Edit</button>
                                            </div>
                                            <div className="text-muted">{quiz.questions?.length || 0} questions</div>
                                        </div>
                                    ))}
                                    {quizzes.length > 0 && <PaginationControls pagination={pagedQuizzes.pagination} onPageChange={(page) => setPage('quizzes', page)} itemLabel="quizzes" />}
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'attendance' && (
                        <section className="card p-4">
                            <h4>Attendance management</h4>
                            <form className="row gy-3 mb-4" onSubmit={handleMarkAttendance}>
                                <div className="col-md-4">
                                    <select className="form-select" value={attendanceForm.student} onChange={(event) => setAttendanceForm((current) => ({ ...current, student: event.target.value }))} required>
                                        <option value="">Select student</option>
                                        {students.map((student) => <option key={student._id} value={student._id}>{student.fullName}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select className="form-select" value={String(attendanceForm.attended)} onChange={(event) => setAttendanceForm((current) => ({ ...current, attended: event.target.value === 'true' }))}>
                                        <option value="true">Attended</option>
                                        <option value="false">Missing</option>
                                    </select>
                                </div>
                                <div className="col-md-3"><input className="form-control" placeholder="Note" value={attendanceForm.note} onChange={(event) => setAttendanceForm((current) => ({ ...current, note: event.target.value }))} /></div>
                                <div className="col-md-2"><button className="btn btn-primary w-100" type="submit">Save</button></div>
                            </form>
                            <div className="table-responsive">
                                <table className="table align-middle">
                                    <thead><tr><th>Student</th><th>Lesson</th><th>Status</th><th>Note</th></tr></thead>
                                    <tbody>
                                        {pagedAttendance.items.map((item) => (
                                            <tr key={item._id}>
                                                <td>{item.user?.fullName || '-'}</td>
                                                <td>{item.lesson?.title || '-'}</td>
                                                <td>{item.attended ? 'Attended' : 'Missing'}</td>
                                                <td>{item.note || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {attendance.length > 0 && <PaginationControls pagination={pagedAttendance.pagination} onPageChange={(page) => setPage('attendance', page)} itemLabel="attendance records" />}
                        </section>
                    )}

                    {activeTab === 'discussion' && (
                        <section className="card p-4">
                            <h4>Discussion moderation</h4>
                            {comments.length === 0 ? <p className="text-muted">No discussion yet.</p> : pagedComments.items.map((comment) => (
                                <div className="border-top py-3" key={comment._id}>
                                    <div className="d-flex justify-content-between gap-3">
                                        <div>
                                            <strong>{comment.title || 'Discussion'}</strong>
                                            <p className="mb-1">{comment.content}</p>
                                            <small className="text-muted">{comment.author?.fullName || 'Member'}</small>
                                        </div>
                                        <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => handlePinComment(comment)}>
                                            {comment.pinned ? 'Unpin' : 'Pin'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {comments.length > 0 && <PaginationControls pagination={pagedComments.pagination} onPageChange={(page) => setPage('comments', page)} itemLabel="comments" />}
                        </section>
                    )}
                </>
            )}
        </div>
    );
};

export default TeacherDashboard;

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories, getCourses } from '../services/course';
import { enrollInCourse } from '../services/enrollment';
import { setCourses, setCoursesError, setCoursesLoading } from '../store/courseSlice';
import CourseImage from '../components/CourseImage';
import PaginationControls from '../components/PaginationControls';

const Courses = () => {
    const dispatch = useDispatch();
    const { items: courses, pagination, loading, error } = useSelector((state) => state.courses);
    const [categories, setCategories] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [category, setCategory] = useState('');
    const [courseQuery, setCourseQuery] = useState({ page: 1, limit: 6, q: '', category: '' });
    const [actionError, setActionError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const initialize = async () => {
            dispatch(setCoursesLoading(true));
            dispatch(setCoursesError(null));
            try {
                const [courseRes, categoryRes] = await Promise.all([
                    getCourses(courseQuery),
                    getCategories()
                ]);
                dispatch(setCourses({
                    courses: courseRes.data.courses,
                    pagination: courseRes.data.pagination
                }));
                setCategories(categoryRes.data.categories || []);
            } catch {
                dispatch(setCoursesError('Cannot load course data.'));
            } finally {
                dispatch(setCoursesLoading(false));
            }
        };

        initialize();
    }, [courseQuery, dispatch]);

    const handleFilters = async () => {
        setActionError(null);
        setSuccess(null);
        setCourseQuery((current) => ({ ...current, page: 1, q: searchText, category }));
    };

    const handlePageChange = (page) => {
        setCourseQuery((current) => ({ ...current, page }));
    };

    const handleLimitChange = (limit) => {
        setCourseQuery((current) => ({ ...current, page: 1, limit }));
    };

    const handleEnroll = async (courseId) => {
        setActionError(null);
        setSuccess(null);
        try {
            await enrollInCourse(courseId);
            setSuccess('Course enrollment created successfully.');
        } catch (requestError) {
            setActionError(requestError.response?.data?.message || 'Cannot enroll in this course.');
        }
    };

    return (
        <div className="courses-page">
            <section className="section-block">
                <div className="section-heading">
                    <div>
                        <span className="eyebrow">Courses</span>
                        <h2>Browse available courses</h2>
                    </div>
                    <p>Explore courses and enroll to receive your class assignment.</p>
                </div>

                <div className="mb-4 row gy-3 align-items-end">
                    <div className="col-md-5">
                        <label className="form-label">Search courses</label>
                        <input
                            type="text"
                            className="form-control"
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                            placeholder="Search by course name or description"
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Category</label>
                        <select className="form-select" value={category} onChange={(event) => setCategory(event.target.value)}>
                            <option value="">All categories</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <button type="button" className="btn btn-primary w-100" onClick={handleFilters}>
                            Apply filters
                        </button>
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                {actionError && <div className="alert alert-danger">{actionError}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {loading ? (
                    <div>Loading courses...</div>
                ) : (
                    <div className="course-grid">
                        {courses.length === 0 ? (
                            <div className="alert alert-secondary">No courses found for this filter.</div>
                        ) : (
                            courses.map((course) => (
                                <article className="course-card" key={course._id}>
                                    <CourseImage course={course} />
                                    <span className="course-tag">{course.category?.name || 'General'}</span>
                                    <h3>{course.title}</h3>
                                    <p>{course.description}</p>
                                    <div className="course-card__footer">
                                        <strong>{course.price?.toLocaleString('vi-VN')}d</strong>
                                        <div className="d-flex gap-2">
                                            {Number(course.price || 0) === 0 && (
                                                <button type="button" className="btn btn-sm btn-light" onClick={() => handleEnroll(course._id)}>
                                                    Enroll
                                                </button>
                                            )}
                                            {Number(course.price || 0) > 0 && (
                                                <Link className="btn btn-sm btn-outline-primary" to={`/checkout/${course._id}`}>
                                                    Checkout
                                                </Link>
                                            )}
                                            <Link className="btn btn-sm btn-primary" to={`/courses/${course._id}`}>
                                                Details
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                )}
                {!loading && courses.length > 0 && pagination && (
                    <PaginationControls
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onLimitChange={handleLimitChange}
                        itemLabel="courses"
                        pageSizeOptions={[6, 9, 12, 24]}
                    />
                )}
            </section>
        </div>
    );
};

export default Courses;

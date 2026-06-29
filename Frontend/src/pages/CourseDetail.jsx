import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCourseById } from '../services/course';
import { enrollInCourse } from '../services/enrollment';
import CourseImage from '../components/CourseImage';

const CourseDetail = () => {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [success, setSuccess] = useState(null);

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

        loadCourse();
    }, [id]);

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
                </div>

                <div className="col-lg-4">
                    <div className="card p-4 mb-4">
                        <h3>Quick actions</h3>
                        <p>{Number(course.price || 0) === 0 ? 'Enroll directly and wait for class assignment.' : 'Review the final amount before continuing to VNPAY.'}</p>
                        <div className="d-grid gap-2 mt-3">
                            {Number(course.price || 0) === 0 ? (
                                <button className="btn btn-outline-primary" type="button" onClick={handleEnroll} disabled={enrollLoading}>
                                    {enrollLoading ? 'Processing...' : 'Enroll now'}
                                </button>
                            ) : (
                                <Link className="btn btn-primary" to={`/checkout/${id}`}>
                                    Continue to checkout
                                </Link>
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

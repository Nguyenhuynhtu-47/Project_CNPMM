import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCourseById } from '../services/course';
import { enrollInCourse } from '../services/enrollment';
import { useSelector } from 'react-redux';
import { getWishlist } from '../services/wishlist';
import CourseImage from '../components/CourseImage';
import WishlistButton from '../components/WishlistButton';

const CourseDetail = () => {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const { user } = useSelector((state) => state.auth);
    const [wishlistIds, setWishlistIds] = useState(new Set());

    useEffect(() => {
        if (user) {
            getWishlist().then(res => {
                const ids = res.data.wishlists?.map(w => w.course?._id || w.course) || [];
                setWishlistIds(new Set(ids));
            }).catch(err => console.error('Failed to fetch wishlist', err));
        } else {
            setWishlistIds(new Set());
        }
    }, [user]);

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
                        <span className="badge bg-warning text-dark px-2.5 py-1.5 fw-bold rounded-2">★ 4.8/5 Course Rating</span>
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
                        <h4 className="fw-bold text-dark mb-3 fs-5">What you will learn</h4>
                        <p className="text-muted small mb-0">This course is designed to guide you step-by-step through core English principles. By the end, you will be able to speak, write, and execute key exercises confidently within various class workspaces.</p>
                    </div>

                    {/* 3. Curriculum Syllabus accordion */}
                    <div className="card border-0 shadow-sm rounded-4 p-4">
                        <h4 className="fw-bold text-dark mb-4 fs-5">Course Syllabus</h4>
                        <div className="accordion rounded-3 overflow-hidden border" id="syllabusAccordion">
                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingOne">
                                    <button className="accordion-button fw-bold text-dark bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                        Chapter 1: Getting Started & Foundations
                                    </button>
                                </h2>
                                <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#syllabusAccordion">
                                    <div className="accordion-body p-0">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item d-flex align-items-center gap-2.5 py-3 px-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                                <span className="small text-dark">Lesson 1.1: Welcome & Course Overview introduction</span>
                                            </li>
                                            <li className="list-group-item d-flex align-items-center gap-2.5 py-3 px-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                                <span className="small text-dark">Lesson 1.2: Essential Setup & Study prerequisites</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingTwo">
                                    <button className="accordion-button collapsed fw-bold text-dark bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                        Chapter 2: Theoretical Core Concepts & Practice
                                    </button>
                                </h2>
                                <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#syllabusAccordion">
                                    <div className="accordion-body p-0">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item d-flex align-items-center gap-2.5 py-3 px-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                                <span className="small text-dark">Lesson 2.1: Key Theoretical Principles Explained</span>
                                            </li>
                                            <li className="list-group-item d-flex align-items-center gap-2.5 py-3 px-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                                <span className="small text-dark">Lesson 2.2: Homework assignments details review</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Student Reviews List */}
                    <div className="card border-0 shadow-sm rounded-4 p-4">
                        <h4 className="fw-bold text-dark mb-4 fs-5">Student Reviews</h4>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <div className="p-3 bg-light rounded-3 border h-100">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <span className="badge bg-warning text-dark fw-bold px-2 py-1">★ 5.0</span>
                                        <strong className="text-dark small">Minh Anh</strong>
                                    </div>
                                    <p className="text-muted small mb-0">"Course was extremely structured and clear. The exercises really helped reinforce my understanding."</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-3 bg-light rounded-3 border h-100">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <span className="badge bg-warning text-dark fw-bold px-2 py-1">★ 4.8</span>
                                        <strong className="text-dark small">Hoang Nam</strong>
                                    </div>
                                    <p className="text-muted small mb-0">"Great lectures. The pacing was perfect for me and the setup guidelines were very helpful."</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column (30% width) - Sticky info card */}
                <div className="col-lg-4">
                    <div className="position-sticky" style={{ top: '24px' }}>
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div style={{ height: '180px', position: 'relative' }}>
                                <CourseImage course={course} className="w-100 h-100 object-fit-cover" />
                                <WishlistButton 
                                    courseId={course._id} 
                                    initialIsWishlisted={wishlistIds.has(course._id)} 
                                    isLoggedIn={!!user} 
                                    className="position-absolute top-0 end-0 m-3"
                                />
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

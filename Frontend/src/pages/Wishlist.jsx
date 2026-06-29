import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CourseImage from '../components/CourseImage';
import { getWishlist, removeFromWishlist } from '../services/wishlist';

const Wishlist = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const loadWishlist = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getWishlist();
            setItems(response.data.wishlists || []);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot load wishlist.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadWishlist();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadWishlist]);

    const handleRemove = async (courseId) => {
        setError('');
        setMessage('');
        try {
            await removeFromWishlist(courseId);
            setItems((current) => current.filter((item) => (item.course?._id || item.course) !== courseId));
            setMessage('Removed from wishlist.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot remove wishlist item.');
        }
    };

    if (loading) {
        return <div className="container py-5">Loading wishlist...</div>;
    }

    return (
        <div className="container py-5">
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
                <div>
                    <span className="eyebrow">Saved courses</span>
                    <h2>My wishlist</h2>
                    <p className="text-muted mb-0">Courses you saved for later.</p>
                </div>
                <Link className="btn btn-outline-primary" to="/courses">Browse courses</Link>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {items.length === 0 ? (
                <div className="card p-4">
                    <h4>No saved courses yet</h4>
                    <p className="text-muted mb-0">Add courses from My learning or course pages to see them here.</p>
                </div>
            ) : (
                <div className="row gy-4">
                    {items.map((item) => {
                        const course = item.course;
                        const courseId = course?._id || course;
                        if (!courseId) return null;

                        return (
                            <div className="col-md-6 col-xl-4" key={item._id || courseId}>
                                <div className="card h-100 overflow-hidden">
                                    <CourseImage course={course} className="course-card-image" />
                                    <div className="p-4 d-flex flex-column gap-3">
                                        <div>
                                            <h5 className="mb-1">{course?.title || 'Course'}</h5>
                                            <p className="text-muted mb-0">{Number(course?.price || 0).toLocaleString('vi-VN')} VND</p>
                                        </div>
                                        <div className="d-flex flex-wrap gap-2 mt-auto">
                                            <Link className="btn btn-primary" to={`/courses/${courseId}`}>View detail</Link>
                                            <button className="btn btn-outline-danger" type="button" onClick={() => handleRemove(courseId)}>Remove</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Wishlist;

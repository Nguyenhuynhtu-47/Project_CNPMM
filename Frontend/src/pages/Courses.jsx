import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories, getCourses } from '../services/course';
import { enrollInCourse } from '../services/enrollment';
import { setCourses, setCoursesError, setCoursesLoading } from '../store/courseSlice';
import { getWishlist } from '../services/wishlist';
import CourseImage from '../components/CourseImage';
import PaginationControls from '../components/PaginationControls';
import WishlistButton from '../components/WishlistButton';

const Courses = () => {
    const dispatch = useDispatch();
    const { items: courses, pagination, loading, error } = useSelector((state) => state.courses);
    const { user } = useSelector((state) => state.auth);
    const [wishlistIds, setWishlistIds] = useState(new Set());
    const [categories, setCategories] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [category, setCategory] = useState('');
    const [sort, setSort] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minPriceDisplay, setMinPriceDisplay] = useState('');
    const [maxPriceDisplay, setMaxPriceDisplay] = useState('');

    const formatNumber = (value) => {
        if (!value) return '';
        const digits = value.toString().replace(/\D/g, '');
        if (!digits) return '';
        return Number(digits).toLocaleString('vi-VN');
    };

    const handlePriceChange = (e, setDisplay, setRaw) => {
        const value = e.target.value;
        const digits = value.replace(/\D/g, '');
        setDisplay(formatNumber(digits));
        setRaw(digits);
    };
    const [courseQuery, setCourseQuery] = useState({
        page: 1,
        limit: 6,
        q: '',
        category: '',
        sort: '',
        minPrice: '',
        maxPrice: ''
    });
    const [actionError, setActionError] = useState(null);
    const [success, setSuccess] = useState(null);

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
        setCourseQuery((current) => ({
            ...current,
            page: 1,
            q: searchText,
            category,
            sort,
            minPrice,
            maxPrice
        }));
    };

    const handleResetFilters = () => {
        setSearchText('');
        setCategory('');
        setSort('');
        setMinPrice('');
        setMaxPrice('');
        setMinPriceDisplay('');
        setMaxPriceDisplay('');
        setActionError(null);
        setSuccess(null);
        setCourseQuery((current) => ({
            ...current,
            page: 1,
            q: '',
            category: '',
            sort: '',
            minPrice: '',
            maxPrice: ''
        }));
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

                <div className="row g-4">
                    {/* Left Sidebar Filters */}
                    <div className="col-lg-3">
                        <div className="bg-light p-4 rounded-4 border shadow-sm position-sticky" style={{ top: '80px', zIndex: 10 }}>
                            <h5 className="fw-bold text-dark mb-4">Filters</h5>
                            <div className="d-flex flex-column gap-3">
                                <div>
                                    <label className="form-label fw-semibold text-secondary small mb-1">Search courses</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white border-end-0 text-muted">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0 ps-0"
                                            value={searchText}
                                            onChange={(event) => setSearchText(event.target.value)}
                                            placeholder="Keyword..."
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="form-label fw-semibold text-secondary small mb-1">Category</label>
                                    <select className="form-select" value={category} onChange={(event) => setCategory(event.target.value)}>
                                        <option value="">All categories</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat._id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="form-label fw-semibold text-secondary small mb-1">Sort by price</label>
                                    <select className="form-select" value={sort} onChange={(event) => setSort(event.target.value)}>
                                        <option value="">Newest</option>
                                        <option value="priceAsc">Price: Low to High</option>
                                        <option value="priceDesc">Price: High to Low</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="form-label fw-semibold text-secondary small mb-1">Price range (VND)</label>
                                    <input
                                        type="text"
                                        className="form-control mb-2"
                                        value={minPriceDisplay}
                                        onChange={(e) => handlePriceChange(e, setMinPriceDisplay, setMinPrice)}
                                        placeholder="From (e.g. 100.000)"
                                    />
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={maxPriceDisplay}
                                        onChange={(e) => handlePriceChange(e, setMaxPriceDisplay, setMaxPrice)}
                                        placeholder="To (e.g. 500.000)"
                                    />
                                </div>

                                <div className="d-flex flex-column gap-2 mt-2">
                                    <button type="button" className="btn btn-primary fw-semibold shadow-sm w-100" onClick={handleFilters}>
                                        Apply Filters
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary fw-semibold w-100" onClick={handleResetFilters}>
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="col-lg-9">
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
                                            <div className="position-relative">
                                                <CourseImage course={course} />
                                                <WishlistButton 
                                                    courseId={course._id} 
                                                    initialIsWishlisted={wishlistIds.has(course._id)} 
                                                    isLoggedIn={!!user} 
                                                    className="position-absolute top-0 end-0 m-2"
                                                />
                                            </div>
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
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Courses;

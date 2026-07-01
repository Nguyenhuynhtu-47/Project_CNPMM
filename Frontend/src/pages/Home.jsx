import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import CourseImage from '../components/CourseImage';
import { getCourses } from '../services/course';
import { getBanners } from '../services/site';

const CourseSlider = ({ title, eyebrow, courses, onDetails }) => (
    <section className="py-4 my-3">
        <div className="mb-4">
            <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1.5 mb-2 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>{eyebrow}</span>
            <h2 className="fw-bold text-dark mb-1">{title}</h2>
            <p className="text-muted small mb-0">Browse and pick the curriculum tracks that best match your professional goals.</p>
        </div>
        <Swiper 
            modules={[Pagination]} 
            pagination={{ clickable: true }} 
            spaceBetween={24} 
            slidesPerView={1} 
            breakpoints={{ 
                576: { slidesPerView: 1.5 },
                768: { slidesPerView: 2 }, 
                1024: { slidesPerView: 3 },
                1200: { slidesPerView: 3.5 }
            }}
            className="pb-5"
        >
            {courses.map((course) => (
                <SwiperSlide key={course._id}>
                    <article className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden d-flex flex-column transition-all hover-shadow">
                        <div className="position-relative" style={{ height: '180px' }}>
                            <CourseImage course={course} className="w-100 h-100 object-fit-cover" />
                            <span className="badge bg-white text-primary position-absolute top-3 start-3 shadow-sm rounded-pill fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.02em', zIndex: 3 }}>
                                {course.category?.name || 'General'}
                            </span>
                        </div>
                        <div className="card-body p-4 d-flex flex-column justify-content-between flex-grow-1">
                            <div>
                                <h5 className="fw-bold text-dark mb-2 text-line-clamp-2" style={{ minHeight: '48px', fontSize: '1.05rem', lineHeight: '1.4' }}>
                                    {course.title}
                                </h5>
                                <p className="text-muted small text-line-clamp-2 mb-3" style={{ fontSize: '0.82rem' }}>
                                    {course.description}
                                </p>
                                <div className="d-flex align-items-center gap-3 text-secondary small mb-4">
                                    <span className="d-flex align-items-center gap-1.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        {course.durationWeeks} weeks
                                    </span>
                                    <span className="d-flex align-items-center gap-1.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
                                        {course.sessionCount} lessons
                                    </span>
                                </div>
                            </div>

                            <div className="d-flex align-items-center justify-content-between pt-3 border-top mt-auto">
                                <strong className="fs-5 text-primary fw-bold">{course.price?.toLocaleString('vi-VN')} VND</strong>
                                <button type="button" className="btn btn-outline-primary btn-sm px-3.5 rounded-3 fw-bold" onClick={() => onDetails(course._id)}>
                                    Details
                                </button>
                            </div>
                        </div>
                    </article>
                </SwiperSlide>
            ))}
        </Swiper>
    </section>
);

const Home = () => {
    const [banners, setBanners] = useState([]);
    const [newCourses, setNewCourses] = useState([]);
    const [bestValueCourses, setBestValueCourses] = useState([]);
    const [premiumCourses, setPremiumCourses] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHome = async () => {
            try {
                const [bannerRes, newestRes, valueRes, premiumRes] = await Promise.all([
                    getBanners(),
                    getCourses({ page: 1, limit: 8, sort: 'newest' }),
                    getCourses({ page: 1, limit: 8, sort: 'priceAsc' }),
                    getCourses({ page: 1, limit: 8, sort: 'priceDesc' })
                ]);

                setBanners(bannerRes.data.banners || []);
                setNewCourses(newestRes.data.courses || []);
                setBestValueCourses(valueRes.data.courses || []);
                setPremiumCourses(premiumRes.data.courses || []);
            } catch (error) {
                console.error(error);
            }
        };

        fetchHome();
    }, []);

    const fallbackBanner = useMemo(() => ({
        title: 'Learn English with structured courses and a clear study path.',
        subtitle: 'Explore curated English courses, follow a guided learning journey, and manage your account from one dashboard.',
        imageUrl: ''
    }), []);

    const heroBanners = banners.length ? banners : [fallbackBanner];

    return (
        <div className="container-fluid px-0 py-3">
            {/* 1. Hero Section Slider */}
            <section className="rounded-4 overflow-hidden mb-4 border shadow-sm">
                <Swiper modules={[Pagination, Autoplay]} autoplay={{ delay: 4500 }} pagination={{ clickable: true }} className="w-100">
                    {heroBanners.map((banner, index) => (
                        <SwiperSlide key={banner._id || index}>
                            <div className="position-relative p-4 p-md-5 d-flex align-items-center" style={{ 
                                minHeight: '380px', 
                                background: banner.imageUrl 
                                    ? `linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.85) 100%), url(${banner.imageUrl})` 
                                    : 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                color: '#ffffff'
                            }}>
                                <div className="col-lg-8 p-0" style={{ zIndex: 2 }}>
                                    <span className="badge bg-primary rounded-pill px-3 py-1.5 mb-3 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>LMS ENGLISH PATH</span>
                                    <h1 className="display-5 fw-bold mb-3">{banner.title}</h1>
                                    <p className="lead mb-4 opacity-90" style={{ fontSize: '1.05rem', maxWidth: '650px' }}>{banner.subtitle}</p>
                                    <div className="d-flex flex-wrap gap-2.5">
                                        <a href="#courses" className="btn btn-light px-4 py-2.5 rounded-3 fw-bold text-primary">Explore courses</a>
                                        <a href={banner.linkUrl || '/profile'} className="btn btn-outline-light px-4 py-2.5 rounded-3 fw-bold" style={{ backdropFilter: 'blur(4px)' }}>Open profile</a>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </section>

            {/* 2. Featured Statistics */}
            <section className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                        <div className="bg-primary-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-primary" style={{ width: '56px', height: '56px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                        <div>
                            <strong className="text-dark d-block fs-3 fw-bold">12K+</strong>
                            <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.7rem' }}>Active learners</span>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                        <div className="bg-success-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-success" style={{ width: '56px', height: '56px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        </div>
                        <div>
                            <strong className="text-dark d-block fs-3 fw-bold">98%</strong>
                            <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.7rem' }}>Course completion</span>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                        <div className="bg-warning-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-warning" style={{ width: '56px', height: '56px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        </div>
                        <div>
                            <strong className="text-dark d-block fs-3 fw-bold">4.9/5</strong>
                            <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.7rem' }}>Student rating</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3 & 4. Course Categories Sliders */}
            <div id="courses">
                <CourseSlider eyebrow="New courses" title="Newest learning tracks" courses={newCourses} onDetails={(id) => navigate(`/courses/${id}`)} />
                <CourseSlider eyebrow="Best value" title="Affordable courses to start today" courses={bestValueCourses} onDetails={(id) => navigate(`/courses/${id}`)} />
                <CourseSlider eyebrow="Premium goals" title="Advanced courses for ambitious learners" courses={premiumCourses} onDetails={(id) => navigate(`/courses/${id}`)} />
            </div>
        </div>
    );
};

export default Home;
